import { Answer, Assessment, AssessmentQuestion, Department, EvidenceFile, MasterQuestion, User, Comment } from '../models/index.js';
import { checkAssessmentState } from '../utils/accessValidators.js';

export const startAssessment = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    // Find the assessment by its primary key (ID)
    const assessment = await Assessment.findByPk(assessmentId);

    // If the assessment is not found, return a 404 error
    if (!assessment) {
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    // If the assessment has already been started, return a 400 error
    if (assessment.assessmentStarted) {
      return res.status(400).json({
        success: false,
        messages: ['Assessment has already been started'],
      });
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
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    // Return a success response with the updated assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment marked as started'],
      assessment: updatedAssessments[0],
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error marking assessment as started:', error);
    res.status(500).json({ success: false, messages: ['Error marking assessment as started'] });
  }
};


export const submitAssessment = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    // Find the assessment by its primary key (ID) and retrieve specific attributes
    const assessment = await Assessment.findByPk(assessmentId, {
      attributes: ['id', 'assessmentStarted', 'submitted', 'startedAt', 'submittedAt'],
    });

    // If the assessment is not found, return a 404 error
    if (!assessment) {
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    // If the assessment has not been started, return a 400 error
    if (!assessment.assessmentStarted) {
      return res.status(400).json({
        success: false,
        messages: ['Assessment must be started before submission'],
      });
    }

    // If the assessment has already been submitted, return a 400 error
    if (assessment.submitted) {
      return res.status(400).json({
        success: false,
        messages: ['Assessment has already been submitted'],
      });
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

    // Return a success response with the updated assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment submitted successfully'],
      assessment: updatedAssessments[0],
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error submitting assessment:', error);
    res.status(500).json({ success: false, messages: ['Error submitting assessment'] });
  }
};


export const getAssessmentById = async (req, res) => {
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
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    // Return a success response with the found assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment retrieved successfully'],
      assessment,
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, messages: ['Error fetching assessment'] });
  }
};


export const reopenAssessment = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    // Find the assessment by its primary key (ID)
    const assessment = await Assessment.findByPk(assessmentId);

    // If the assessment is not found, return a 404 error
    if (!assessment) {
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    // If the assessment has not been submitted, it cannot be reopened
    if (!assessment.submitted) {
      return res.status(400).json({
        success: false,
        messages: ['Assessment is not submitted, cannot reopen'],
      });
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
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    // Return a success response with the updated assessment
    res.status(200).json({
      success: true,
      messages: ['Assessment reopened successfully'],
      assessment: updatedAssessments[0],
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of any issues
    console.error('Error reopening assessment:', error);
    res.status(500).json({ success: false, messages: ['Error reopening assessment'] });
  }
};


export const getAssessmentQuestionsByAssessmentId = async (req, res) => {
  const { assessmentId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Fetch the assessment details to check if it has started or been submitted
    const assessment = await Assessment.findOne({
      where: { id: assessmentId },
      attributes: ['assessmentStarted', 'submitted'],
    });

    // If assessment is not found deny access
    if (!assessment) {
      return res.status(404).json({
        success: false,
        messages: ['Assessment not found'],
      });
    }


    const { assessmentStarted, submitted } = assessment;
    // If the assessment has not started or has already been submitted, deny access
    if (!assessmentStarted || submitted) {
      return res.status(403).json({
        success: false,
        messages: ['Access denied: Insufficient content permissions.'],
      });
    }

    // Fetch the questions for the assessment with pagination
    const { count, rows: questions } = await AssessmentQuestion.findAndCountAll({
      where: { assessmentId },
      attributes: ['id', 'assessmentId'],
      include: [
        {
          model: MasterQuestion, // Include the associated master question text
          as: 'masterQuestion',
          attributes: ['questionText'],
        },
        {
          model: Answer, // Include the answers related to the question
          as: 'answer',
          attributes: ['id', 'answerText', 'createdAt', 'updatedAt'],
          include: [
            {
              model: EvidenceFile, // Include evidence files associated with answers
              as: 'evidenceFiles',
              attributes: ['id', 'filePath', 'createdAt', 'updatedAt'],
              order: [['createdAt', 'ASC']],
              include: [{
                model: User, // Include the creator of the evidence file
                as: 'creator',
                attributes: ['id', 'username'],
              }]
            },
            {
              model: User, // Include the creator of the answer
              as: 'creator',
              attributes: ['id', 'username'],
            }
          ],
        },
        {
          model: Comment, // Include comments related to the question
          as: 'comments',
          paranoid: false,
          include: [
            {
              model: User, // Include the creator of the comment
              as: 'creator',
              attributes: ['id', 'username'],
            },
          ],
          order: [['createdAt', 'ASC']], // Order comments by creation date
        },
      ],
      limit, // Limit the number of questions fetched per page
      offset: (page - 1) * limit, // Calculate offset for pagination
    });

    // If no questions are found, return a success response with empty questions
    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No questions found for the given assessment'],
        questions: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit,
        },
      });
    }

    // Calculate the total number of pages for pagination
    const totalPages = Math.ceil(count / limit);

    // If the requested page is out of range, return a 404 error
    if (page > totalPages) {
      return res.status(404).json({
        success: false,
        messages: ['Page not found'],
      });
    }

    // Return the questions with pagination details
    res.status(200).json({
      success: true,
      messages: ['Assessment questions retrieved successfully'],
      questions,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    // Log the error and return a 500 server error if anything goes wrong
    console.error('Error fetching assessment questions:', error);
    res.status(500).json({
      success: false,
      messages: ['Internal server error'],
    });
  }
};

