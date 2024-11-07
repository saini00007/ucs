import { Assessment, Company, Department } from '../models/index.js';

export const markAssessmentAsStarted = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const [updatedCount, updatedAssessments] = await Assessment.update(
      { assessmentStarted: true, updatedAt: new Date() },
      {
        where: { id: assessmentId },
        returning: true,
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    res.status(200).json({
      success: true,
      messages: ['Assessment marked as started'],
      assessment: updatedAssessments[0],
    });
  } catch (error) {
    console.error('Error marking assessment as started:', error);
    res.status(500).json({ success: false, messages: ['Error marking assessment as started'] });
  }
};

export const getAssessmentByDepartmentId = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const assessments = await Assessment.findAll({
      where: { departmentId },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'departmentName'] },
      ],
    });

    if (!assessments || assessments.length === 0) {
      return res.status(404).json({
        success: false,
        messages: ['No assessments found for the given department'],
      });
    }

    res.status(200).json({
      success: true,
      messages: ['Assessments retrieved successfully'],
      assessments,
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, messages: ['Error fetching assessments'] });
  }
};

export const getAssessmentById = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'departmentName'] },
      ],
    });

    if (!assessment) {
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    res.status(200).json({
      success: true,
      messages: ['Assessment retrieved successfully'],
      assessment,
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, messages: ['Error fetching assessment'] });
  }
};
