import { Assessment, Company, Department } from '../models/index.js';

export const markAssessmentAsStarted = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const assessment = await Assessment.findByPk(assessmentId);

    if (!assessment) {
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    if (assessment.assessmentStarted) {
      return res.status(400).json({
        success: false,
        messages: ['Assessment has already been started'],
      });
    }

    const [updatedCount, updatedAssessments] = await Assessment.update(
      {
        assessmentStarted: true,
        startedAt: new Date(),
      },
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


export const submitAssessment = async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const assessment = await Assessment.findByPk(assessmentId, {
      attributes: ['id', 'assessmentStarted', 'submitted', 'startedAt', 'submittedAt'],
    });

    if (!assessment) {
      return res.status(404).json({ success: false, messages: ['Assessment not found'] });
    }

    if (!assessment.assessmentStarted) {
      return res.status(400).json({
        success: false,
        messages: ['Assessment must be started before submission'],
      });
    }
    if (assessment.submitted) {
      return res.status(400).json({
        success: false,
        messages: ['Assessment has already been submitted'],
      });
    }

    const [updatedCount, updatedAssessments] = await Assessment.update(
      {
        submitted: true,
        submittedAt: new Date(),

      },
      {
        where: { id: assessmentId },
        returning: true,
      }
    );

    res.status(200).json({
      success: true,
      messages: ['Assessment submitted successfully'],
      assessment: updatedAssessments[0],
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ success: false, messages: ['Error submitting assessment'] });
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
