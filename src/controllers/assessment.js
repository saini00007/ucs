import  {Assessment}  from '../models/index.js'; // Adjust the path as needed

// Mark an assessment as started
export const markAssessmentAsStarted = async (req, res) => {
    const { assessmentId } = req.params;
    console.log('heyyyy');

    try {
        const [updatedAssessment, created] = await Assessment.update(
            { assessment_started: true, updated_at: new Date() }, // Update fields
            {
                where: { assessment_id: assessmentId },
                returning: true // This option allows us to retrieve the updated row
            }
        );

        if (updatedAssessment === 0) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.status(200).json({
            message: 'Assessment marked as started',
            data: created[0] // Access the updated row
        });
    } catch (error) {
        console.error('Error marking assessment as started:', error);
        res.status(500).json({ message: 'Error marking assessment as started', error: error.message });
    }
};

// Get all assessments for a specific department
export const getAllAssessments = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const assessments = await Assessment.findAll({
            where: { department_id: departmentId },
            attributes: ['assessment_id', 'company_id', 'department_id', 'created_at', 'updated_at', 'assessment_started']
        });

        if (assessments.length === 0) {
            return res.status(404).json({ message: 'No assessments found for this department' });
        }

        res.status(200).json({ data: assessments });
    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ message: 'Error fetching assessments', error: error.message });
    }
};

// Get an assessment by ID
export const getAssessmentById = async (req, res) => {
    const { assessmentId } = req.params;

    try {
        const assessment = await Assessment.findOne({
            where: { assessment_id: assessmentId }
        });

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.status(200).json({ data: assessment });
    } catch (error) {
        console.error('Error fetching assessment:', error);
        res.status(500).json({ message: 'Error fetching assessment', error: error.message });
    }
};
