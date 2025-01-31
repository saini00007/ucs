import { AssessmentQuestion, EvidenceFile, Answer, User, SubAssessment } from '../models/index.js';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';
import { ANSWER_TYPES, SUB_ASSESSMENT_REVIEW_STATUS, ANSWER_REVIEW_STATUS } from '../utils/constants.js';
import { submitAssessment } from './assessment.js';

export const createAnswer = async (req, res, next) => {
  const { assessmentQuestionId } = req.params;
  const { answerText } = req.body;
  const userId = req.user.id;

  // Start transaction for atomic operations
  const transaction = await sequelize.transaction();

  try {
    // Check if the assessment question exists
    const question = await AssessmentQuestion.findOne({
      where: { id: assessmentQuestionId },
      attributes: ['assessmentId'],
      transaction,
    });

    if (!question) {
      throw new AppError('Assessment question not found.', 404);
    }

    // Check if an answer already exists for the question
    const existingAnswer = await Answer.findOne({
      where: { assessmentQuestionId },
      transaction,
    });

    if (existingAnswer) {
      throw new AppError('Answer already exists for this question.', 400);
    }

    // Validate that answerText is provided
    if (!answerText) {
      throw new AppError('Answer text is required.', 400);
    }

    // Validate that evidence files are uploaded if the answer is "yes"
    const isAnswerYes = answerText === ANSWER_TYPES.YES;

    if (isAnswerYes && (!req.files?.['files'] || req.files['files'].length === 0)) {
      throw new AppError('Evidence files are required when the answer is "yes".', 400);
    }
    if (!isAnswerYes && req.files['files'] && req.files?.['files'].length > 0) {
      throw new AppError('No evidence files should be uploaded when the answer is "no" or "not applicable".', 400);
    }

    const isAutoApproved = answerText === ANSWER_TYPES.NO || answerText === ANSWER_TYPES.NOT_APPLICABLE;

    // Create the answer
    const answer = await Answer.create({
      assessmentQuestionId,
      createdByUserId: userId,
      reviewStatus: isAutoApproved ? ANSWER_REVIEW_STATUS.APPROVED : ANSWER_REVIEW_STATUS.PENDING,
      answerText,
    }, { transaction });

    if (isAnswerYes) {
      // Save evidence files if the answer is "yes"
      await Promise.all(req.files['files'].map(async (file) => {
        await EvidenceFile.create({
          fileName: file.originalname,
          filePath: file.originalname, // have to change it to the path of external cloud storage
          pdfData: file.buffer,
          createdByUserId: userId,
          answerId: answer.id,
        }, { transaction });
      }));
    }

    // Refetch the answer with associated evidence files and user information
    const refetchedAnswer = await Answer.findOne({
      where: { id: answer.id },
      include: [{
        model: EvidenceFile,
        as: 'evidenceFiles',
        attributes: ['id', 'filePath', 'fileName', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'ASC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }]
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName']
      }],
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    // Return the created answer
    res.status(201).json({
      success: true,
      messages: ['Answer created successfully'],
      answer: refetchedAnswer,
    });
  } catch (error) {
    transaction.rollback();
    next(error);
  }
};

export const updateAnswer = async (req, res, next) => {
  const { answerId } = req.params;
  const { answerText } = req.body;
  const userId = req.user.id;

  const transaction = await sequelize.transaction();

  try {
    // Find the answer with its relationships
    const answer = await Answer.findOne({
      where: { id: answerId },
      include: [{
        model: AssessmentQuestion,
        as: 'assessmentQuestion',
        include: [{
          model: SubAssessment,
          as: 'subAssessment'
        }]
      }],
      transaction
    });

    if (!answer) {
      throw new AppError('Answer not found', 404);
    }

    // Check if subAssessment is in proper state
    const validStates = [SUB_ASSESSMENT_REVIEW_STATUS.DRAFT, SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION];
    if (!validStates.includes(answer.assessmentQuestion.subAssessment.reviewStatus)) {
      throw new AppError('Cannot update answer in current assessment state', 400);
    }

    const isUpdatingToYes = answerText === ANSWER_TYPES.YES;
    const isUpdatingToNo = answerText === ANSWER_TYPES.NO || answerText === ANSWER_TYPES.NOT_APPLICABLE;

    // Handle evidence files
    if (isUpdatingToNo) {
      await EvidenceFile.destroy({
        where: { answerId: answer.id },
        transaction
      });
    } else if (isUpdatingToYes && (!req.files?.['files'] || req.files['files'].length === 0)) {
      throw new AppError('Evidence files are required for YES answers', 400);
    }

    // Prepare update data
    const updateData = {
      answerText,
      createdByUserId: userId
    };

    // If updating to NO or NOT_APPLICABLE, auto-approve the answer
    if (isUpdatingToNo) {
      updateData.reviewStatus = ANSWER_REVIEW_STATUS.APPROVED;
      updateData.reviewedAt = new Date();
    }
    // If this was a rejected answer being updated to YES, set to IMPROVED
    else if (answer.reviewStatus === ANSWER_REVIEW_STATUS.REJECTED && isUpdatingToYes) {
      updateData.reviewStatus = ANSWER_REVIEW_STATUS.IMPROVED;
      updateData.reviewedAt = null;
      updateData.reviewedByUserId = null;
    }

    // Update answer
    await answer.update(updateData, { transaction });

    // Handle new evidence files for YES answers
    if (isUpdatingToYes && req.files?.['files']) {
      await Promise.all(req.files['files'].map(file =>
        EvidenceFile.create({
          fileName: file.originalname,
          filePath: file.originalname,
          pdfData: file.buffer,
          createdByUserId: userId,
          answerId: answer.id
        }, { transaction })
      ));
    }

    // If this was a rejected answer update OR changing to auto-approved status, 
    // check if all rejected answers are now updated
    if (answer.reviewStatus === ANSWER_REVIEW_STATUS.IMPROVED ||
      (isUpdatingToNo && answer.reviewStatus === ANSWER_REVIEW_STATUS.APPROVED)) {
      const remainingRejected = await Answer.count({
        include: [{
          model: AssessmentQuestion,
          as: 'assessmentQuestion',
          where: { subAssessmentId: answer.assessmentQuestion.subAssessmentId }
        }],
        where: {
          reviewStatus: ANSWER_REVIEW_STATUS.REJECTED
        },
        transaction
      });

      // If all rejected answers are updated, change status back to SUBMITTED_FOR_REVIEW
      if (remainingRejected === 0 && submitAssessment.reviewStatus === SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION) {
        await answer.assessmentQuestion.subAssessment.update({
          reviewStatus: SUB_ASSESSMENT_REVIEW_STATUS.SUBMITTED_FOR_REVIEW,
          submittedForReviewAt: new Date(),
          submittedForReviewBy: userId
        }, { transaction });
      }
    }

    // Fetch updated answer with associations
    const updatedAnswer = await Answer.findOne({
      where: { id: answer.id },
      include: [
        {
          model: EvidenceFile,
          as: 'evidenceFiles',
          attributes: ['id', 'filePath', 'fileName', 'createdAt'],
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      messages: ['Answer updated successfully'],
      answer: updatedAnswer
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const serveFile = async (req, res, next) => {
  const { fileId } = req.params;

  try {
    // Find the evidence file by primary key (fileId)
    const evidenceFile = await EvidenceFile.findByPk(fileId);

    // If the file is not found, return a 404 response
    if (!evidenceFile) {
      throw new AppError('File not found.', 404);
    }

    // Destructure the filePath and pdfData from the found evidence file
    const { filePath, pdfData } = evidenceFile;

    // Set the response headers to specify the file type (PDF) and disposition (inline)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filePath}"`);

    // Send the PDF data as the response body
    res.send(pdfData);
  } catch (error) {
    // Log any errors that occur during the file retrieval process
    console.error('Error retrieving file data:', error);

    // Return a 500 error if something goes wrong while retrieving the file
    next(error);
  }
};

export const submitReviewDecision = async (req, res, next) => {
  const { answerId } = req.params;
  const { decision } = req.body;
  const userId = req.user.id;
  console.log(decision);

  const transaction = await sequelize.transaction();

  try {
    const answer = await Answer.findOne({
      where: { id: answerId },
      include: [{
        model: AssessmentQuestion,
        as: 'assessmentQuestion',
        include: [{
          model: SubAssessment,
          as: 'subAssessment'
        }]
      }],
      transaction
    });

    if (!answer) {
      throw new AppError('Answer not found', 404);
    }

    // Update answer review status
    await answer.update({
      reviewStatus: decision === ANSWER_REVIEW_STATUS.APPROVED ? ANSWER_REVIEW_STATUS.APPROVED : ANSWER_REVIEW_STATUS.REJECTED,
      reviewedByUserId: userId,
      reviewedAt: new Date()
    }, { transaction });

    // Check if all answers are reviewed
    const subAssessmentId = answer.assessmentQuestion.subAssessmentId;
    const pendingAnswers = await Answer.count({
      include: [{
        model: AssessmentQuestion,
        as: 'assessmentQuestion',
        where: { subAssessmentId }
      }],
      where: {
        reviewStatus: ANSWER_REVIEW_STATUS.PENDING
      },
      transaction
    });

    // Update subAssessment status based on review results
    if (pendingAnswers === 0) {
      const rejectedAnswers = await Answer.count({
        include: [{
          model: AssessmentQuestion,
          as: 'assessmentQuestion',
          where: { subAssessmentId }
        }],
        where: {
          reviewStatus: ANSWER_REVIEW_STATUS.REJECTED
        },
        transaction
      });

      const newStatus = rejectedAnswers > 0 ?
        SUB_ASSESSMENT_REVIEW_STATUS.NEED_REVISION :
        SUB_ASSESSMENT_REVIEW_STATUS.COMPLETED;

      await answer.assessmentQuestion.subAssessment.update({
        reviewStatus: newStatus,
        completedAt: newStatus === SUB_ASSESSMENT_REVIEW_STATUS.COMPLETED ? new Date() : null
      }, { transaction });
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      messages: [`Review decision ${decision} submitted successfully`]
    });

  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
