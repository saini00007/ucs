import { Answer, EvidenceFile, AnswerEvidenceFile } from '../models/index.js';

import { validationResult } from 'express-validator'; // For input validation

export const createAnswer = async (req, res) => {
  // Validate request body
  const {assessmentQuestionId,assessmentId}=req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Use camelCase properties from the request body
  const {answerText } = req.body; 
  const userId = req.user_id; // Assuming user_id is set in the request (e.g., by a middleware)

  // Check if files were uploaded in the request
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  try {
    // Array to store evidence files
    const evidenceFiles = await Promise.all(req.files.map(async (file) => {
      // Create evidence file using Sequelize
      const evidenceFile = await EvidenceFile.create({
        file_path: file.originalname,
        pdf_data: file.buffer,
        uploaded_by_user_id: userId,
      });
      return evidenceFile;
    }));

    // Insert the answer details into the answers table
    const answer = await Answer.create({
      assessment_question_id: assessmentQuestionId, // Using snake_case in the DB
      user_id: userId,
      answer_text: answerText, // Using snake_case in the DB
    });

    // Link each uploaded file to the created answer
    await Promise.all(evidenceFiles.map(async (evidenceFile) => {
      await AnswerEvidenceFile.create({
        answerId: answer.answer_id, // Ensure 'answer_id' matches the model definition
        evidenceFileId: evidenceFile.evidence_file_id, // Ensure 'evidence_file_id' matches the model definition
      });
    }));

    // Respond with the created answer and associated evidence file IDs
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


// Controller to retrieve all answers for a specific assessment question
export const getAnswersByQuestion = async (req, res) => {
    const { assessment_question_id } = req.params;
  
    try {
      // Query to fetch answers and their associated evidence files
      const answers = await Answer.findAll({
        where: { assessment_question_id },
        include: [{
          model: EvidenceFile,
          through: { model: AnswerEvidenceFile },
          as: 'EvidenceFiles', // This should match the alias defined in the association
          required: false // Optional join
        }]
      });
  
      // Check if no answers were found
      if (answers.length === 0) {
        return res.status(404).json({ success: false, message: 'No answers found for this question.' });
      }
  
      // Format the response to include evidence files with answers
      const answersWithEvidence = answers.map(answer => ({
        answer_id: answer.answer_id,
        user_id: answer.user_id,
        answer_text: answer.answer_text,
        evidence_files: answer.EvidenceFiles.map(evidence => ({
          evidence_file_id: evidence.evidence_file_id,
          file_path: evidence.file_path
        }))
      }));
  
      // Respond with the gathered answers and evidence
      res.status(200).json({ success: true, answers: answersWithEvidence });
    } catch (error) {
      console.error('Error retrieving answers:', error);
      res.status(500).json({ success: false, message: 'Error retrieving answers.', error: error.message });
    }
  };
  


// Controller to serve an uploaded file
export const serveFile = async (req, res) => {
  const { file_id } = req.params;

  try {
    // Fetch the file data from the database using the file ID
    const evidenceFile = await EvidenceFile.findOne({ where: { evidence_file_id: file_id } });

    // Check if the file was found
    if (!evidenceFile) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const { file_path, pdf_data } = evidenceFile;

    // Set headers to indicate the file type and prompt download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file_path}"`);

    // Send the PDF data as the response
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
    // Delete the answer from the database
    const result = await Answer.destroy({ where: { answer_id } });

    // Check if the answer was not found
    if (result === 0) {
      return res.status(404).json({ success: false, message: 'Answer not found.' });
    }

    // Respond with a success message
    res.status(200).json({ success: true, message: 'Answer deleted successfully.' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ success: false, message: 'Error deleting answer.' });
  }
};
