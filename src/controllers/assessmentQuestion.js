import { AssessmentQuestion, MasterQuestion } from '../models/index.js';
// Add a question to an assessment
export const addAssessmentQuestion = async (req, res) => {
    const { assessmentId } = req.params; // Get assessmentId from the URL parameters
    const { questionId } = req.body; // Use questionId from the request body

    try {
        const assessmentQuestion = await AssessmentQuestion.create({
            assessment_id: assessmentId,
            question_id: questionId
        });

        res.status(201).json({
            message: 'Assessment question added successfully',
            data: assessmentQuestion
        });
    } catch (error) {
        console.error('Error adding assessment question:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a specific assessment question by ID
export const getAssessmentQuestionById = async (req, res) => {
    const { id } = req.params;

    try {
        const assessmentQuestion = await AssessmentQuestion.findOne({
            where: { assessment_question_id: id },
            include: {
                model: MasterQuestion,
                attributes: ['question_text'] // Specify fields from MasterQuestion
            }
        });

        if (!assessmentQuestion) {
            return res.status(404).json({ message: 'Assessment question not found' });
        }

        res.status(200).json(assessmentQuestion);
    } catch (error) {
        console.error('Error fetching assessment question:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all questions for a specific assessment
export const getAssessmentQuestions = async (req, res) => {
    const { assessmentId } = req.params;

    try {
        const assessmentQuestions = await AssessmentQuestion.findAll({
            where: { assessment_id: assessmentId },
            include: {
                model: MasterQuestion,
                attributes: ['question_text'] // Specify fields from MasterQuestion
            }
        });

        res.status(200).json(assessmentQuestions);
    } catch (error) {
        console.error('Error retrieving assessment questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an assessment question
export const deleteAssessmentQuestion = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await AssessmentQuestion.destroy({
            where: { assessment_question_id: id }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Assessment question not found' });
        }

        res.status(200).json({ message: 'Assessment question deleted successfully' });
    } catch (error) {
        console.error('Error deleting assessment question:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
