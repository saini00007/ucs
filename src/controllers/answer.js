import { validationResult } from 'express-validator';
import Answer from '../models/Answer.js';
import EvidenceFile from '../models/EvidenceFile.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';
import User from '../models/User.js';

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
    if (isAnswerYes && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        messages: ['Evidence files are required when the answer is "yes".'],
      });
    }

    const answer = await Answer.create({
      assessmentQuestionId,
      createdByUserId: userId,
      answerText,
    });

    let evidenceFiles = [];
    if (isAnswerYes) {
      evidenceFiles = await Promise.all(req.files.map(async (file) => {
        const evidenceFile = await EvidenceFile.create({
          filePath: file.originalname,
          pdfData: file.buffer,
          createdByUserId: userId,
          answerId: answer.id,
        });
        return {
          id: evidenceFile.id,
          filePath: evidenceFile.filePath,
          createdAt: evidenceFile.createdAt,
          updatedAt: evidenceFile.updatedAt,
          creator: { id: userId, username: req.user.username },
        };
      }));
    }

    const response = {
      ...answer.get({ plain: true }),
      evidenceFiles: evidenceFiles,
      creator: { id: userId, username: req.user.username, },
    };

    res.status(201).json({
      success: true,
      messages: ['Answer created successfully'],
      answer: response,
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
      include: [{
        model: EvidenceFile,
        as: 'evidenceFiles',
        attributes: ['id', 'filePath', 'createdAt', 'updatedAt'],
      }],
    });

    if (!answer) {
      return res.status(404).json({ success: false, messages: ['Answer not found.'] });
    }

    const isUpdatingToYes = answerText === "yes";
    const hasExistingEvidenceFiles = answer.evidenceFiles.length > 0;

    if (isUpdatingToYes && !hasExistingEvidenceFiles && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        messages: ['You must upload evidence files when updating the answer to "yes".'],
      });
    }

    if (answerText) {
      answer.answerText = answerText;
    }

    if (answer.createdByUserId !== userId) {
      answer.createdByUserId = userId;
    }

    await answer.save();

    let newEvidenceFiles = [];

    if (isUpdatingToYes && req.files && req.files.length > 0) {
      newEvidenceFiles = await Promise.all(req.files.map(async (file) => {
        const evidenceFile = await EvidenceFile.create({
          filePath: file.originalname,
          pdfData: file.buffer,
          createdByUserId: userId,
          answerId: answer.id,
        });
        return {
          id: evidenceFile.id,
          filePath: evidenceFile.filePath,
          creator: { id: userId, username: req.user.username },
        };
      }));
    }

    const completeEvidenceFiles = [
      ...answer.evidenceFiles.map(file => ({
        id: file.id,
        filePath: file.filePath,
        creator: { id: userId, username: req.user.username, }
      })),
      ...newEvidenceFiles,
    ];

    completeEvidenceFiles.sort((a, b) => a.createdAt - b.createdAt);

    res.status(200).json({
      success: true,
      messages: ['Answer updated successfully'],
      answer: {
        ...answer.get({ plain: true }),
        evidenceFiles: completeEvidenceFiles,
        creator: { id: userId, username: req.user.username },
      },
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
        as: 'evidenceFiles',
        attributes: ['id', 'filePath'],
        order: [['createdAt', 'ASC']],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }]
      }, {
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }
      ],
    });

    if (!answer) {
      return res.status(404).json({
        success: false,
        messages: ['No Answer found'],
      });
    }

    res.status(200).json({
      success: true,
      answer: answer,
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
