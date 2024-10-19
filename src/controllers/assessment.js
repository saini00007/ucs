import { Assessment } from '../models/index.js';

export const markAssessmentAsStarted = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const [updatedCount, updatedAssessments] = await Assessment.update(
      { assessmentStarted: true, updatedAt: new Date() },
      {
        where: { assessmentId },
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

export const getAllAssessments = async (req, res) => {
  const { departmentId } = req.params;
  const { page = 1 } = req.query;

  try {
    const { count, rows: assessments } = await Assessment.findAndCountAll({
      where: { departmentId },
      attributes: ['assessmentId', 'companyId', 'departmentId', 'createdAt', 'updatedAt', 'assessmentStarted'],
      limit: 10,
      offset: (page - 1) * 10,
    });

    const totalPages = Math.ceil(count / 10);

    if (page > totalPages) {
      return res.status(404).json({ success: false, message: ['Page not found'] });
    }

    if (assessments.length === 0) {
      return res.status(404).json({ success: false, message: ['No assessments found for this department'] });
    }

    res.status(200).json({
      success: true,
      message: ['Assessments retrieved successfully'],
      assessments,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, message: ['Error fetching assessments'] });
  }
};

export const getAssessmentById = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const assessment = await Assessment.findOne({
      where: { assessmentId }
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
    res.status(500).json({ success: false, message: ['Error fetching assessment']});
  }
};
