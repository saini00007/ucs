import { query } from '../db/db.js';

// Controller to create an answer with file uploads
export const createAnswer = async (req, res) => {
  const { assessment_question_id, user_id, answer_text } = req.body;

  // Check if files were uploaded in the request
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded.' });
  }

  try {
    // Array to store IDs of the uploaded evidence files
    const evidenceFileIds = [];

    // Iterate through each uploaded file
    for (const file of req.files) {
      // Insert the file details into the evidence_files table
      const fileResult = await query(`
        INSERT INTO evidence_files (file_path, pdf_data, uploaded_by_user_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [file.originalname, file.buffer, user_id]); // Use originalname as file_path

      // Collect the evidence file ID
      evidenceFileIds.push(fileResult.rows[0].evidence_file_id);
    }

    // Insert the answer details into the answers table
    const result = await query(`
      INSERT INTO answers (assessment_question_id, user_id, answer_text)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [assessment_question_id, user_id, answer_text]);

    // Link each uploaded file to the created answer
    for (const evidenceFileId of evidenceFileIds) {
      await query(`
        INSERT INTO answer_evidence_files (answer_id, evidence_file_id)
        VALUES ($1, $2)
      `, [result.rows[0].answer_id, evidenceFileId]);
    }

    // Respond with the created answer and associated evidence file IDs
    res.status(201).json({ success: true, answer: result.rows[0], evidence_file_ids: evidenceFileIds });
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({ success: false, message: 'Error creating answer.' });
  }
};

// Controller to retrieve all answers for a specific assessment question
export const getAnswersByQuestion = async (req, res) => {
  const { assessment_question_id } = req.params;

  try {
    // Query to fetch answers and their associated evidence files
    const result = await query(`
      SELECT a.answer_id, a.user_id, a.answer_text, 
             e.evidence_file_id, e.file_path
      FROM answers a
      LEFT JOIN answer_evidence_files aef ON a.answer_id = aef.answer_id
      LEFT JOIN evidence_files e ON aef.evidence_file_id = e.evidence_file_id
      WHERE a.assessment_question_id = $1
    `, [assessment_question_id]);

    // Check if no answers were found
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No answers found for this question.' });
    }

    // Group answers with their associated evidence files
    const answersWithEvidence = result.rows.reduce((acc, row) => {
      const { answer_id, user_id, answer_text, evidence_file_id, file_path } = row;

      // Check if the answer already exists in the accumulator
      const existingAnswer = acc.find(answer => answer.answer_id === answer_id);
      if (existingAnswer) {
        // Add evidence file to the existing answer
        if (file_path) {
          existingAnswer.evidence_files.push({ evidence_file_id, file_path });
        }
      } else {
        // Create a new answer entry with evidence files
        acc.push({
          answer_id,
          user_id,
          answer_text,
          evidence_files: file_path ? [{ evidence_file_id, file_path }] : [],
        });
      }
      return acc;
    }, []); // Initialize the accumulator as an empty array

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
    const result = await query('SELECT file_path, pdf_data FROM evidence_files WHERE evidence_file_id = $1', [file_id]);

    // Check if the file was found
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const { file_path, pdf_data } = result.rows[0];

    // Set headers to indicate the file type and prompt download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file_path}"`); // Optional: prompt download with original file name

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
    const result = await query(`
      DELETE FROM answers
      WHERE answer_id = $1
      RETURNING *
    `, [answer_id]);

    // Check if the answer was not found
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Answer not found.' });
    }

    // Respond with a success message
    res.status(200).json({ success: true, message: 'Answer deleted successfully.' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ success: false, message: 'Error deleting answer.' });
  }
};
