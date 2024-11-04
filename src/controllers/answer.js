import { validationResult } from 'express-validator';
import Answer from '../models/Answer.js';
import EvidenceFile from '../models/EvidenceFile.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';

export const createAnswer = async (req, res) => {
  const { assessmentQuestionId } = req.params;
  const { answerText } = req.body;
  const userId = req.user.id;

  try {
    const question = await AssessmentQuestion.findOne({
      where: { id: assessmentQuestionId },
      attributes: ['assessmentId'],
    });

    if (!question) {
      return res.status(404).json({ success: false, messages: ['Assessment question not found.'] });
    }

    const assessmentId = question.assessmentId;

    const existingAnswer = await Answer.findOne({
      where: { assessmentQuestionId, createdByUserId: userId },
    });

    if (existingAnswer) {
      return res.status(400).json({ success: false, messages: ['Answer already exists for this question.'] });
    }

    if (!answerText) {
      return res.status(400).json({ success: false, messages: ['Answer text is required.'] });
    }

    const isAnswerYes = answerText.toLowerCase() === "yes";

    if (isAnswerYes) {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, messages: ['Evidence files are required when the answer is "yes".'] });
      }
    }

    const answer = await Answer.create({
      assessmentQuestionId,
      createdByUserId: userId,
      answerText,
    });

    let evidenceFileIds = [];

    if (isAnswerYes) {
      const evidenceFiles = await Promise.all(req.files.map(async (file) => {
        const evidenceFile = await EvidenceFile.create({
          filePath: file.originalname,
          pdfData: file.buffer,
          createdByUserId: userId,
          answerId: answer.id, // Directly linking evidence file to the answer
        });
        evidenceFileIds.push(evidenceFile.dataValues.id);
        return evidenceFile;
      }));
    }

    res.status(201).json({
      success: true,
      messages: ['Answer created successfully'],
      answer,
      evidenceFileIds,
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({ success: false, messages: ['Internal server error while creating answer.'] });
  }
};

export const updateAnswer = async (req, res) => {
  const { answerId } = req.params;
  const { answerText } = req.body;
  const userId = req.user.id;

  try {
    const answer = await Answer.findOne({
      where: { id: answerId },
      include: [
        {
          model: AssessmentQuestion,
          attributes: ['assessmentId'],
        },
        {
          model: EvidenceFile,
          attributes: ['id', 'filePath']
        }
      ],
    });

    if (!answer) {
      return res.status(404).json({ success: false, messages: ['Answer not found.'] });
    }

    const isUpdatingToYes = answerText === "yes";
    const hasExistingEvidenceFiles = answer.EvidenceFiles.length > 0;

    if (isUpdatingToYes && !hasExistingEvidenceFiles && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        messages: ['You must upload evidence files when updating the answer to "yes".'],
      });
    }

    if (answerText) {
      answer.answerText = answerText;
      await answer.save();
    }

    let updatedFiles = []; // Array to hold newly added evidence files

    if (isUpdatingToYes && req.files && req.files.length > 0) {
      updatedFiles = await Promise.all(req.files.map(async (file) => {
        const evidenceFile = await EvidenceFile.create({
          filePath: file.originalname,
          pdfData: file.buffer,
          createdByUserId: userId,
          answerId: answer.id,
        });
        // Return an object containing the ID and filePath of the new evidence file
        return {
          id: evidenceFile.id,
          filePath: evidenceFile.filePath, // Include the filePath in the response
        };
      }));
    }

    res.status(200).json({
      success: true,
      messages: ['Answer updated successfully'],
      answer,
      updatedFiles, // Return the array of newly added evidence files with IDs and filePaths
    });
  } catch (error) {
    console.error('Error updating answer:', error);
    res.status(500).json({ success: false, messages: ['Internal server error while updating answer.'] });
  }
};


export const getAnswerByQuestion = async (req, res) => {
  const { assessmentQuestionId } = req.params;

  try {
    const answer = await Answer.findOne({
      where: { assessmentQuestionId },
      include: [{
        model: EvidenceFile,
        required: false
      }]
    });

    if (!answer) {
      return res.status(200).json({
        success: true,
        messages: ['No Answer found'],
        answer: null,
      });
    }

    const answerWithEvidence = {
      answerId: answer.id,
      createdByUserId: answer.createdByUserId,
      answerText: answer.answerText,
      evidenceFiles: answer.EvidenceFiles.map(evidence => ({
        evidenceFileId: evidence.id,
        filePath: evidence.filePath
      }))
    };

    res.status(200).json({
      success: true,
      answer: answerWithEvidence,
    });
  } catch (error) {
    console.error('Error retrieving answer:', error);
    res.status(500).json({ success: false, messages: ['Error retrieving answer.'], error: error.message });
  }
};

export const serveFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const evidenceFile = await EvidenceFile.findByPk(fileId);

    if (!evidenceFile) {
      return res.status(404).json({ success: false, messages: ['File not found.'] });
    }

    const { filePath, pdfData } = evidenceFile;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filePath}"`);
    res.send(pdfData);
  } catch (error) {
    console.error('Error retrieving file data:', error);
    res.status(500).json({ success: false, messages: ['Error retrieving file.'] });
  }
};

export const deleteAnswer = async (req, res) => {
  const { answerId } = req.params;

  try {
    const result = await Answer.destroy({ where: { id: answerId } });

    if (result === 0) {
      return res.status(404).json({ success: false, messages: ['Answer not found.'] });
    }

    res.status(200).json({ success: true, messages: ['Answer deleted successfully.'] });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ success: false, messages: ['Error deleting answer.'] });
  }
};
