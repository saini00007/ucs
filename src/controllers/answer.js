import { validationResult } from 'express-validator';
import Answer from '../models/Answer.js';
import EvidenceFile from '../models/EvidenceFile.js';
import AnswerEvidenceFile from '../models/AnswerEvidenceFile.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';

export const createAnswer = async (req, res) => {
  const { assessmentQuestionId } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { answerText } = req.body;
  const userId = req.user.userId;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  try {
    const question = await AssessmentQuestion.findOne({
      where: { assessmentQuestionId },
      attributes: ['assessmentId'],
    });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Assessment question not found.' });
    }

    const assessmentId = question.assessmentId;

    const evidenceFiles = await Promise.all(req.files.map(async (file) => {
      const evidenceFile = await EvidenceFile.create({
        filePath: file.originalname,
        pdfData: file.buffer,
        uploadedByUserId: userId,
        assessmentId,
      });
      return evidenceFile;
    }));

    const answer = await Answer.create({
      assessmentQuestionId,
      userId,
      answerText, 
    });

    await Promise.all(evidenceFiles.map(async (evidenceFile) => {
      await AnswerEvidenceFile.create({
        answerId: answer.answerId,
        evidenceFileId: evidenceFile.evidenceFileId,
      });
    }));

    res.status(201).json({
      success: true,
      answer,
      evidenceFileIds: evidenceFiles.map(file => file.evidenceFileId),
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({ success: false, message: 'Internal server error while creating answer.' });
  }
};

export const getAnswersByQuestion = async (req, res) => {
  const { assessmentQuestionId } = req.params;

  try {
    const answers = await Answer.findAll({
      where: { assessmentQuestionId },
      include: [{
        model: EvidenceFile,
        through: { model: AnswerEvidenceFile },
        as: 'EvidenceFiles',
        required: false
      }]
    });

    if (answers.length === 0) {
      return res.status(404).json({ success: false, message: 'No answers found for this question.' });
    }

    const answersWithEvidence = answers.map(answer => ({
      answerId: answer.answerId,
      userId: answer.userId,
      answerText: answer.answerText,
      evidenceFiles: answer.EvidenceFiles.map(evidence => ({
        evidenceFileId: evidence.evidenceFileId,
        filePath: evidence.filePath
      }))
    }));

    res.status(200).json({ success: true, answers: answersWithEvidence });
  } catch (error) {
    console.error('Error retrieving answers:', error);
    res.status(500).json({ success: false, message: 'Error retrieving answers.', error: error.message });
  }
};

export const serveFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const evidenceFile = await EvidenceFile.findOne({ where: { evidenceFileId: fileId } });

    if (!evidenceFile) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const { filePath, pdfData } = evidenceFile;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filePath}"`);
    res.send(pdfData);
  } catch (error) {
    console.error('Error retrieving file data:', error);
    res.status(500).json({ success: false, message: 'Error retrieving file.' });
  }
};

export const deleteAnswer = async (req, res) => {
  const { answerId } = req.params;

  try {
    const result = await Answer.destroy({ where: { answerId } });

    if (result === 0) {
      return res.status(404).json({ success: false, message: 'Answer not found.' });
    }

    res.status(200).json({ success: true, message: 'Answer deleted successfully.' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ success: false, message: 'Error deleting answer.' });
  }
};
