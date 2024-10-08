import { query } from '../db/db.js';

export const createAssessment = async (req, res) => {
    const { templateId, departmentId } = req.body;

    try {
        // Check if the template is assigned to the department
        const templateCheck = await query(`
        SELECT * FROM department_templates 
        WHERE template_id = $1 AND department_id = $2
      `, [templateId, departmentId]);

        if (templateCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Template not assigned to this department' });
        }

        // Create the assessment
        const result = await query(`
        INSERT INTO assessments (template_id, department_id)
        VALUES ($1, $2)
        RETURNING *
      `, [templateId, departmentId]);

        const assessmentId = result.rows[0].assessment_id;

        const questions = await query(`
        SELECT question_id FROM template_questions 
        WHERE template_id = $1
      `, [templateId]);

        // Insert questions into assessment_questions
        for (const question of questions.rows) {
            await query(`
          INSERT INTO assessment_questions (assessment_id, question_id, added_by_company)
          VALUES ($1, $2, $3)
        `, [assessmentId, question.question_id, false]); // Set added_by_company to false for template questions
        }

        res.status(201).json({ message: 'Assessment created successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error creating assessment:', error);
        res.status(500).json({ message: 'Error creating assessment', error: error.message });
    }
};



// Get an assessment by ID
export const getAssessmentById = async (req, res) => {
    const { assessmentId } = req.params;

    try {
        const result = await query(`
      SELECT * FROM assessments WHERE assessment_id = $1
    `, [assessmentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.status(200).json({ data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching assessment:', error);
        res.status(500).json({ message: 'Error fetching assessment', error: error.message });
    }
};

// Get all assessments for a specific department
export const getAllAssessmentsByDepartment = async (req, res) => {
    const { departmentId } = req.params;

    try {
        const result = await query(`
        SELECT * FROM assessments WHERE department_id = $1
      `, [departmentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No assessments found for this department' });
        }

        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ message: 'Error fetching assessments', error: error.message });
    }
};

// Delete an assessment
export const deleteAssessment = async (req, res) => {
    const { assessmentId } = req.params;

    try {
        const result = await query(`
      DELETE FROM assessments WHERE assessment_id = $1 RETURNING *
    `, [assessmentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.status(204).json({ message: 'Assessment deleted successfully' });
    } catch (error) {
        console.error('Error deleting assessment:', error);
        res.status(500).json({ message: 'Error deleting assessment', error: error.message });
    }
};
