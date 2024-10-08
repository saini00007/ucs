import { query } from '../db/db.js';

// Add a question to an assessment
export const addAssessmentQuestion = async (req, res) => {
  console.log("helllooooooo");
  const { assessment_id, question_id, added_by_company=true } = req.body;
  console.log(req.body);
  try {
    await query(`
      INSERT INTO assessment_questions (assessment_id, question_id, added_by_company)
      VALUES ($1, $2, $3)
    `, [assessment_id, question_id, added_by_company]);

    res.status(201).send('Assessment question added successfully');
  } catch (error) {
    console.error('Error adding assessment question:', error);
    res.status(500).send('Server error');
  }
};

export const getAssessmentQuestionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT aq.assessment_question_id, aq.assessment_id, aq.question_id, aq.added_by_company,
             mq.question_text, mq.framework
      FROM assessment_questions aq
      LEFT JOIN master_questions mq ON aq.question_id = mq.question_id
      WHERE aq.assessment_question_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Assessment question not found');
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching assessment question:', error);
    res.status(500).send('Server error');
  }
}

// Get all questions for a specific assessment
export const getAssessmentQuestions = async (req, res) => {
  const { assessmentId } = req.params;
  try {
    const result = await query(`
      SELECT aq.assessment_question_id, aq.added_by_company, mq.question_text
      FROM assessment_questions aq
      JOIN master_questions mq ON aq.question_id = mq.question_id
      WHERE aq.assessment_id = $1
    `, [assessmentId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving assessment questions:', error);
    res.status(500).send('Server error');
  }
};


// Delete an assessment question
export const deleteAssessmentQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    await query(`
      DELETE FROM assessment_questions
      WHERE assessment_question_id = $1
    `, [id]);

    res.status(200).send('Assessment question deleted successfully');
  } catch (error) {
    console.error('Error deleting assessment question:', error);
    res.status(500).send('Server error');
  }
};
