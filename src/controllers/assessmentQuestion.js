import { AssessmentQuestion, MasterQuestion } from '../models/index.js';

export const addAssessmentQuestion = async (req, res) => {
    const { assessmentId } = req.params;
    const { questionId } = req.body;

    try {
        const assessmentQuestion = await AssessmentQuestion.create({
            assessment_id: assessmentId,
            question_id: questionId
        });

        res.status(201).json({
            success: true,
            message: 'Assessment question added successfully',
            data: assessmentQuestion
        });
    } catch (error) {
        console.error('Error adding assessment question:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const getAssessmentQuestionById = async (req, res) => {
    const { assessmentQuestionId } = req.params;

    try {
        const assessmentQuestion = await AssessmentQuestion.findOne({
            where: { assessment_question_id: assessmentQuestionId },
            include: {
                model: MasterQuestion,
                attributes: ['question_text']
            }
        });

        if (!assessmentQuestion) {
            return res.status(404).json({ success: false, message: 'Assessment question not found' });
        }

        res.status(200).json({ success: true, data: assessmentQuestion });
    } catch (error) {
        console.error('Error fetching assessment question:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const getAssessmentQuestions = async (req, res) => {
    const { assessmentId } = req.params;

    try {
        const assessmentQuestions = await AssessmentQuestion.findAll({
            where: { assessment_id: assessmentId },
            include: {
                model: MasterQuestion,
                attributes: ['question_text']
            }
        });

        res.status(200).json({ success: true, data: assessmentQuestions });
    } catch (error) {
        console.error('Error retrieving assessment questions:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const deleteAssessmentQuestions = async (req, res) => {
    const { questionIds } = req.body; // Get question IDs from the request body

    try {
        const result = await AssessmentQuestion.destroy({
            where: {
                assessment_question_id: questionIds
            }
        });

        if (result === 0) {
            return res.status(404).json({ success: false, message: 'No assessment questions found' });
        }

        res.status(200).json({ success: true, message: 'Assessment questions deleted successfully', deletedCount: result });
    } catch (error) {
        console.error('Error deleting assessment questions:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
