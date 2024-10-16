import { Assessment } from '../models/index.js';

export const markAssessmentAsStarted = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const [updatedCount, updatedAssessments] = await Assessment.update(
      { assessment_started: true, updated_at: new Date() },
      {
        where: { assessment_id: assessmentId },
        returning: true
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Assessment marked as started',
      data: updatedAssessments[0]
    });
  } catch (error) {
    console.error('Error marking assessment as started:', error);
    res.status(500).json({ success: false, message: 'Error marking assessment as started', error: error.message });
  }
};

export const getAllAssessments = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const assessments = await Assessment.findAll({
      where: { department_id: departmentId },
      attributes: ['assessment_id', 'company_id', 'department_id', 'created_at', 'updated_at', 'assessment_started']
    });

    if (assessments.length === 0) {
      return res.status(404).json({ success: false, message: 'No assessments found for this department' });
    }

    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, message: 'Error fetching assessments', error: error.message });
  }
};

export const getAssessmentById = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const assessment = await Assessment.findOne({
      where: { assessment_id: assessmentId }
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    res.status(200).json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, message: 'Error fetching assessment', error: error.message });
  }
};
