import { validationResult } from 'express-validator';
import Answer from '../models/Answer.js';
import EvidenceFile from '../models/EvidenceFile.js';
import AnswerEvidenceFile from '../models/AnswerEvidenceFile.js';

export const createAnswer = async (req, res) => {
  const { assessmentQuestionId, assessmentId } = req.params; // Now we need both IDs
  const errors = validationResult(req);

  // Validate the request
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { answerText } = req.body; // Get answer text from body
  const userId = req.user.user_id; // Assuming user_id is set in the request

  // Check if files are uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  try {
    // Create Evidence Files and link them to the Assessment
    const evidenceFiles = await Promise.all(req.files.map(async (file) => {
      const evidenceFile = await EvidenceFile.create({
        file_path: file.originalname, // Storing the original file name
        pdf_data: file.buffer, // Assuming you are storing the PDF data in binary
        uploaded_by_user_id: userId, // Link to the user who uploaded the file
        assessment_id: assessmentId, // Link the evidence file to the assessment
      });
      return evidenceFile; // Return the created EvidenceFile
    }));

    // Create Answer
    const answer = await Answer.create({
      assessment_question_id: assessmentQuestionId, // Link to the specific assessment question
      user_id: userId, // Link to the user answering
      answer_text: answerText, // Save the answer text
    });

    // Link Evidence Files to the Answer
    await Promise.all(evidenceFiles.map(async (evidenceFile) => {
      await AnswerEvidenceFile.create({
        answerId: answer.answer_id, // Use the answer's ID
        evidenceFileId: evidenceFile.evidence_file_id, // Link to the evidence file
      });
    }));

    // Respond with success
    res.status(201).json({
      success: true,
      answer,
      evidence_file_ids: evidenceFiles.map(file => file.evidence_file_id), // Return IDs of the linked evidence files
    });
  } catch (error) {
    console.error('Error creating answer:', error); // Log the error for debugging
    res.status(500).json({ success: false, message: 'Internal server error while creating answer.' });
  }
};


// Controller to retrieve all answers for a specific assessment question
export const getAnswersByQuestion = async (req, res) => {
  const { assessment_question_id } = req.params;

  try {
    const answers = await Answer.findAll({
      where: { assessment_question_id },
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
  const { file_id } = req.params;

  try {
    const evidenceFile = await EvidenceFile.findOne({ where: { evidence_file_id: file_id } });

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

// Controller to delete an answer
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
