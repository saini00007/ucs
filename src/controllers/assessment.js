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
  const limit=10

  try {
    const { count, rows: assessments } = await Assessment.findAndCountAll({
      where: { departmentId },
      attributes: ['assessmentId', 'companyId', 'departmentId', 'createdAt', 'updatedAt', 'assessmentStarted'],
      limit: limit,
      offset: (page - 1) * limit,
    });

    if (count === 0) {
      return res.status(200).json({
        success: true,
        messages: ['No Assessments found'],
        assessments: [],
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
      return res.status(404).json({ success: false, message: ['Page not found'] });
    }

    res.status(200).json({
      success: true,
      message: ['Assessments retrieved successfully'],
      assessments,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
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
