import { AssessmentQuestion, MasterQuestion } from '../models/index.js';

export const addAssessmentQuestions = async (req, res) => {
  const { assessmentId } = req.params;
  const { questionIds } = req.body; 

  try {
    const assessmentQuestions = await Promise.all(
      questionIds.map(async (questionId) => {
        return await AssessmentQuestion.create({
          assessmentId,
          questionId,
        });
      })
    );

    res.status(201).json({
      success: true,
      messages: ['Assessment questions added successfully'],
      assessmentQuestions,
    });
  } catch (error) {
    console.error('Error adding assessment questions:', error);
    res.status(500).json({ success: false, messages: ['Server error'] });
  }
};


export const getAssessmentQuestionById = async (req, res) => {
  const { assessmentQuestionId } = req.params;

  try {
    const assessmentQuestion = await AssessmentQuestion.findOne({
      where: { assessmentQuestionId },
      include: {
        model: MasterQuestion,
        attributes: ['questionText'],
      },
    });

    if (!assessmentQuestion) {
      return res.status(404).json({ success: false, messages: ['Assessment question not found'] });
    }

    res.status(200).json({ success: true, assessmentQuestion });
  } catch (error) {
    console.error('Error fetching assessment question:', error);
    res.status(500).json({ success: false, messages: ['Server error'] });
  }
};

export const getAssessmentQuestions = async (req, res) => {
  const { assessmentId } = req.params;
  const { page = 1 } = req.query;
  const limit=10;

  try {
    const { count, rows: assessmentQuestions } = await AssessmentQuestion.findAndCountAll({
      where: { assessmentId },
      include: {
        model: MasterQuestion,
        attributes: ['questionText'],
      },
      limit: limit,
      offset: (page - 1) * limit,
    });

    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No Assessment Questions found'],
        assessmentQuestions: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit
        },
      });
    }

    const totalPages = Math.ceil(count / limit);

    if (page > totalPages) {
      return res.status(404).json({ success: false, messages: ['Page not found'] });
    }

    res.status(200).json({
      success: true,
      assessmentQuestions,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      },
    });
  } catch (error) {
    console.error('Error retrieving assessment questions:', error);
    res.status(500).json({ success: false, messages: ['Server error'] });
  }
};

export const deleteAssessmentQuestions = async (req, res) => {
  const { questionIds } = req.body;

  try {
    const result = await AssessmentQuestion.destroy({
      where: {
        assessmentQuestionId: questionIds,
      },
    });

    if (result === 0) {
      return res.status(404).json({ success: false, messages: ['No assessment questions found'] });
    }

    res.status(200).json({ success: true, messages: ['Assessment questions deleted successfully'], deletedCount: result });
  } catch (error) {
    console.error('Error deleting assessment questions:', error);
    res.status(500).json({ success: false, messages: ['Server error'] });
  }
};
