import { Answer, Assessment, AssessmentQuestion, Department, EvidenceFile, MasterQuestion, User, Comment } from '../models/index.js';
import { checkAssessmentState } from '../utils/accessValidators.js';
import AppError from '../utils/AppError.js';
import { calculateAssessmentStatistics } from '../utils/calculateStatistics.js';

export const startAssessment = async (req, res, next) => {
  const { assessmentId } = req.params;

  try {
    // Find the assessment by its primary key (ID)
    const assessment = await Assessment.findByPk(assessmentId);

    // If the assessment is not found, return a 404 error
    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // If the assessment has already been started, return a 400 error
    if (assessment.assessmentStarted) {
      throw new AppError('Assessment has already been started', 400);
    }

    // Update the assessment to mark it as started and set the start time
    const [updatedCount, updatedAssessments] = await Assessment.update(
      {
        assessmentStarted: true,
        startedAt: new Date(),
      },
      {
        where: { id: assessmentId },
        returning: true, // Return the updated assessment
      }
    );

    // If no rows were updated, return a 404 error
    if (updatedCount === 0) {
      throw new AppError('Assessment not found', 404);
    }

    // Calculate answer statistics for the assessment
    const stats = await calculateAssessmentStatistics(assessment.id);

    // Add the statistics to the assessment data

    const assessmentResponse = updatedAssessments[0].toJSON();
    assessmentResponse.stats = stats;

    // Return a success response with the updated assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment marked as started'],
      assessment: assessmentResponse,
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error marking assessment as started:', error);
    next(error);
  }
};

export const submitAssessment = async (req, res, next) => {
  const { assessmentId } = req.params;

  try {
    // Find the assessment by its primary key (ID) and retrieve specific attributes
    const assessment = await Assessment.findByPk(assessmentId, {
      attributes: ['id', 'assessmentStarted', 'submitted', 'startedAt', 'submittedAt'],
    });

    // If the assessment is not found, return a 404 error
    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // If the assessment has not been started, return a 400 error
    if (!assessment.assessmentStarted) {
      throw new AppError('Assessment must be started before submission', 400);
    }

    // If the assessment has already been submitted, return a 400 error
    if (assessment.submitted) {
      throw new AppError('Assessment has already been submitted', 400);
    }

    // Update the assessment to mark it as submitted and set the submission time
    const [updatedCount, updatedAssessments] = await Assessment.update(
      {
        submitted: true,
        submittedAt: new Date(),
      },
      {
        where: { id: assessmentId },
        returning: true, // Return the updated assessment
      }
    );

    // Calculate answer statistics for the assessment
    const stats = await calculateAssessmentStatistics(assessment.id);

    // Add the statistics to the assessment data

    const assessmentResponse = updatedAssessments[0].toJSON();
    assessmentResponse.stats = stats;

    // Return a success response with the updated assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment submitted successfully'],
      assessment: assessmentResponse,
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error submitting assessment:', error);
    next(error);
  }
};

export const getAssessmentById = async (req, res, next) => {
  const { assessmentId } = req.params;

  try {
    // Find the assessment by its primary key (ID) and include the related department
    const assessment = await Assessment.findOne({
      where: { id: assessmentId },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'departmentName'] },
      ],
    });

    // If the assessment is not found, return a 404 error
    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // Calculate answer statistics for the assessment
    const stats = await calculateAssessmentStatistics(assessment.id);

    // Add the statistics to the assessment data

    const assessmentResponse = assessment.toJSON();
    assessmentResponse.stats = stats;

    // Return a success response with the found assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment retrieved successfully'],
      assessment: assessmentResponse,
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error fetching assessment:', error);
    next(error);
  }
};

export const reopenAssessment = async (req, res, next) => {
  const { assessmentId } = req.params;

  try {
    // Find the assessment by its primary key (ID)
    const assessment = await Assessment.findByPk(assessmentId);

    // If the assessment is not found, return a 404 error
    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // If the assessment has not been submitted, it cannot be reopened
    if (!assessment.submitted) {
      throw new AppError('Assessment is not submitted, cannot reopen', 400);
    }

    // Update the assessment to mark it as not submitted and clear the submittedAt date
    const [updatedCount, updatedAssessments] = await Assessment.update(
      {
        submitted: false,
        submittedAt: null,
      },
      {
        where: { id: assessmentId },
        returning: true,
      }
    );

    // If no assessments were updated, return a 404 error
    if (updatedCount === 0) {
      throw new AppError('Assessment not found', 404);
    }

    // Calculate answer statistics for the assessment
    const stats = await calculateAssessmentStatistics(assessment.id);

    // Add the statistics to the assessment data
    const assessmentResponse = updatedAssessments[0].toJSON();
    assessmentResponse.stats = stats;

    // Return a success response with the updated assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment reopened successfully'],
      assessment: assessmentResponse,
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error reopening assessment:', error);
    next(error);
  }
};

export const getAssessmentQuestionsByAssessmentId = async (req, res, next) => {
  const { assessmentId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId },
      attributes: ['assessmentStarted', 'submitted'],
    });

    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // Check assessment state
    const assessmentState = checkAssessmentState(assessment);

    // Parse and validate pagination params
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new AppError('Invalid pagination parameters', 400);
    }
    if (!assessmentState.success) {
      throw new AppError(
        req.user.roleId === 'superadmin'
          ? assessmentState.message || 'Access denied: Insufficient content permissions.'
          : 'Access denied: Insufficient content permissions.',
        assessmentState.status || 403
      );
    }

    // Fetch the questions for the assessment with pagination
    const { count, rows: questions } = await AssessmentQuestion.findAndCountAll({
      where: { assessmentId },
      attributes: ['id', 'assessmentId'],
      include: [
        {
          model: MasterQuestion,
          as: 'masterQuestion',
          attributes: ['questionText'],
        },
        {
          model: Answer,
          as: 'answer',
          attributes: ['id', 'answerText', 'createdAt', 'updatedAt'],
          include: [
            {
              model: EvidenceFile,
              as: 'evidenceFiles',
              attributes: ['id', 'filePath', 'createdAt', 'updatedAt'],
              order: [['createdAt', 'ASC']],
              include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'username'],
              }]
            },
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username'],
            }
          ],
        },
        {
          model: Comment,
          as: 'comments',
          paranoid: false,
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'username'],
          }],
          order: [['createdAt', 'ASC']],
        },
      ],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);

    // Check if page exists
    if (pageNum > totalPages && count > 0) {
      throw new AppError('Page not found', 404);
    }

    // Return response with pagination
    res.status(200).json({
      success: true,
      messages: count === 0 ? ['No questions found for the given assessment'] : ['Assessment questions retrieved successfully'],
      questions,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      },
    });

  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    next(error);
  }
};


