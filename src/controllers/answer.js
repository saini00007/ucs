import { AssessmentQuestion, EvidenceFile, Answer, User } from '../models/index.js';
import sequelize from '../config/db.js';
import AppError from '../utils/AppError.js';

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
    const isAnswerYes = answerText.toLowerCase() === "yes";
    if (isAnswerYes && (!req.files?.['files'] || req.files['files'].length === 0)) {
      throw new AppError('Evidence files are required when the answer is "yes".', 400);
    }
    if (!isAnswerYes && req.files['files'] && req.files?.['files'].length > 0) {
      throw new AppError('No evidence files should be uploaded when the answer is "no" or "not applicable".', 400);
    }

    // Create the answer
    const answer = await Answer.create({
      assessmentQuestionId,
      createdByUserId: userId,
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
          attributes: ['id', 'username']
        }]
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
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
    console.error('Error creating answer:', error);
    next(error);
  }
};

export const updateAnswer = async (req, res, next) => {
  const { answerId } = req.params;
  const { answerText } = req.body;
  const userId = req.user.id;

  // Start a new transaction for atomic operations
  const transaction = await sequelize.transaction();

  try {
    // Find the existing answer along with associated evidence files
    const answer = await Answer.findOne({
      where: { id: answerId },
      include: [{
        model: EvidenceFile,
        as: 'evidenceFiles',
        attributes: ['id', 'filePath', 'createdAt', 'updatedAt'],
      }],
      transaction,
    });

    if (!answer) {
      throw new AppError('Answer not found.', 404);
    }

    // Check if the answer is being updated to "yes" or "no"
    const isUpdatingToYes = answerText.toLowerCase() === "yes";
    const isUpdatingToNo = answerText.toLowerCase() === "no" || answerText.toLowerCase() === "notapplicable";
    const hasExistingEvidenceFiles = answer.evidenceFiles.length > 0;

    // Validation: No evidence files should be uploaded when updating to "no" or "not applicable"
    if (isUpdatingToNo && req.files?.['files'] && req.files['files'].length > 0) {
      throw new AppError('No evidence files should be uploaded when the answer is "no" or "not applicable".', 400);
    }

    // Remove existing evidence files if updating to "no"
    if (isUpdatingToNo && hasExistingEvidenceFiles) {
      await Promise.all(answer.evidenceFiles.map(async (file) => {
        await EvidenceFile.destroy({ where: { id: file.id }, transaction });
      }));
    }

    // Validation: Ensure evidence files are uploaded when updating to "yes"
    if (isUpdatingToYes && (!req.files?.['files'] || req.files['files'].length === 0)) {
      throw new AppError('Evidence files are required when the answer is "yes".', 400);
    }

    // Update the answer text if it's different from the existing text
    if (answerText !== answer.answerText) {
      answer.answerText = answerText;
    }

    // Ensure the creator of the answer is set to the current user
    if (answer.createdByUserId !== userId) {
      answer.createdByUserId = userId;
    }

    // Save the updated answer
    await answer.save({ transaction });

    // Create new evidence files if the answer is "yes" and files are uploaded
    if (isUpdatingToYes) {
      await Promise.all(req.files['files'].map(async (file) => {
        await EvidenceFile.create({
          fileName: file.originalname,
          filePath: file.originalname,
          pdfData: file.buffer,
          createdByUserId: userId,
          answerId: answer.id,
        }, { transaction });
      }));
    }

    // Refetch the updated answer with associated evidence files and user info
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
          attributes: ['id', 'username']
        }]
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }],
      transaction,
    });

    // Commit the transaction
    await transaction.commit();

    // Return the updated answer with evidence files
    res.status(200).json({
      success: true,
      messages: ['Answer updated successfully'],
      answer: refetchedAnswer,
    });
  } catch (error) {
    console.error('Error updating answer:', error);
    await transaction.rollback(); // Rollback transaction on error
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

// export const deleteAnswer = async (req, res) => {
//   const { answerId } = req.params;

//   try {
//     const result = await Answer.destroy({ where: { id: answerId } });

//     if (result === 0) {
//       return res.status(404).json({ success: false, messages: ['Answer not found.'] });
//     }

//     res.status(200).json({ success: true, messages: ['Answer deleted successfully.'] });
//   } catch (error) {
//     console.error('Error deleting answer:', error);
//     res.status(500).json({ success: false, messages: ['Error deleting answer.'] });
//   }
// };
