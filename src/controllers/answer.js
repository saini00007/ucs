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
  const userId = req.user.user_id; 

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  try {
    const question = await AssessmentQuestion.findOne({
      where: { assessment_question_id: assessmentQuestionId },
      attributes: ['assessment_id'],
    });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Assessment question not found.' });
    }

    const assessmentId = question.assessment_id;

    const evidenceFiles = await Promise.all(req.files.map(async (file) => {
      const evidenceFile = await EvidenceFile.create({
        file_path: file.originalname,
        pdf_data: file.buffer,
        uploaded_by_user_id: userId,
        assessment_id: assessmentId,
      });
      return evidenceFile;
    }));

    const answer = await Answer.create({
      assessment_question_id: assessmentQuestionId,
      user_id: userId,
      answer_text: answerText, 
    });

    await Promise.all(evidenceFiles.map(async (evidenceFile) => {
      await AnswerEvidenceFile.create({
        answerId: answer.answer_id, 
        evidenceFileId: evidenceFile.evidence_file_id, 
      });
    }));

    res.status(201).json({
      success: true,
      answer,
      evidence_file_ids: evidenceFiles.map(file => file.evidence_file_id),
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
      where: { assessment_question_id: assessmentQuestionId },
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
      answer_id: answer.answer_id,
      user_id: answer.user_id,
      answer_text: answer.answer_text,
      evidence_files: answer.EvidenceFiles.map(evidence => ({
        evidence_file_id: evidence.evidence_file_id,
        file_path: evidence.file_path
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
    const evidenceFile = await EvidenceFile.findOne({ where: { evidence_file_id: fileId } });

    if (!evidenceFile) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const { file_path, pdf_data } = evidenceFile;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file_path}"`);
    res.send(pdf_data);
  } catch (error) {
    console.error('Error retrieving file data:', error);
    res.status(500).json({ success: false, message: 'Error retrieving file.' });
  }
};

export const deleteAnswer = async (req, res) => {
  const { answer_id } = req.params;

  try {
    const result = await Answer.destroy({ where: { answer_id } });

    if (result === 0) {
      return res.status(404).json({ success: false, message: 'Answer not found.' });
    }

    res.status(200).json({ success: true, message: 'Answer deleted successfully.' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ success: false, message: 'Error deleting answer.' });
  }
};
