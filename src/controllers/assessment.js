import { Assessment, Company, Department } from '../models/index.js';

export const markAssessmentAsStarted = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const [updatedCount, updatedAssessments] = await Assessment.update(
      { assessmentStarted: true, updatedAt: new Date() },
      {
        where: { id: assessmentId },
        returning: true
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ success: false, message: ['Assessment not found'] });
    }

    res.status(200).json({
      success: true,
      message: ['Assessment marked as started'],
      Assessment: updatedAssessments[0]
    });
  } catch (error) {
    console.error('Error marking assessment as started:', error);
    res.status(500).json({ success: false, message: ['Error marking assessment as started'] });
  }
};

export const getAssessmentByDepartmentId = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const assessment = await Assessment.findOne({
      where: { departmentId },
      attributes: ['id', 'departmentId', 'assessmentName', 'createdAt', 'updatedAt', 'assessmentStarted'],
      include: [
        { model: Department }
      ]
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: ['Assessment not found for the given department'],
      });
    }

    res.status(200).json({
      success: true,
      message: ['Assessment retrieved successfully'],
      assessment,
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, message: ['Error fetching assessment'] });
  }
};


export const getAssessmentById = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId },
      include:
        [
          { model: Department }
        ]
      ,
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: ['Assessment not found'] });
    }

    res.status(200).json({
      success: true,
      message: ['Assessment retrieved successfully'],
      assessment
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, message: ['Error fetching assessment'] });
  }
};
