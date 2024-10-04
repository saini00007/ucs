import { query } from '../db/db.js';

// Controller to create a template based on a master department
export const createTemplateFromDepartment = async (req, res) => {
    const { templateName, masterDepartmentId } = req.body;

    try {
        // Create a new template
        const templateResult = await query(`
            INSERT INTO templates (template_name, master_department_id)
            VALUES ($1, $2)
            RETURNING template_id
        `, [templateName, masterDepartmentId]);

        const templateId = templateResult.rows[0].template_id;
        console.log(templateId);

        // Fetch master question IDs related to the department
        const questionsResult = await query(`
            SELECT question_id FROM question_department_links
            WHERE master_department_id = $1
        `, [masterDepartmentId]);

        // Insert master question IDs into the template_questions table
        for (const row of questionsResult.rows) {
            await query(`
                INSERT INTO template_questions (template_id, question_id)
                VALUES ($1, $2)
            `, [templateId, row.question_id]);
        }

        res.status(201).json({ message: 'Template created successfully!', templateId });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createEmptyTemplate = async (req, res) => {
    const { templateName } = req.body;

    try {
        // Create a new empty template
        const result = await query(`
            INSERT INTO templates (template_name)
            VALUES ($1)
            RETURNING template_id
        `, [templateName]);

        const templateId = result.rows[0].template_id;

        res.status(201).json({ message: 'Empty template created successfully!', templateId });
    } catch (error) {
        console.error('Error creating empty template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const addQuestionsToTemplate = async (req, res) => {
    const { templateId, questionIds } = req.body;

    if (!templateId || !Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ error: 'Invalid request data. Please provide templateId and questionIds.' });
    }

    try {
        // Create a bulk insert query
        const values = questionIds.map((questionId) => `(${templateId}, ${questionId.questionId})`).join(',');
        
        // Execute the bulk insert
        await query(`
            INSERT INTO template_questions (template_id, question_id)
            VALUES ${values}
            
        `);

        res.status(200).json({ message: 'Questions added to template successfully!' });
    } catch (error) {
        console.error('Error adding questions to template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const removeQuestionsFromTemplate = async (req, res) => {
    const { templateQuestionIds } = req.body; // Expecting an array of template_question_ids

    if (!Array.isArray(templateQuestionIds) || templateQuestionIds.length === 0) {
        return res.status(400).json({ error: 'Invalid request data. Please provide templateQuestionIds.' });
    }

    try {
        // Create a bulk delete query using the template_question_ids
        const values = templateQuestionIds.map(id => `(${id})`).join(',');

        await query(`
            DELETE FROM template_questions
            WHERE template_question_id IN (${values})
        `);

        res.status(200).json({ message: 'Questions removed from template successfully!' });
    } catch (error) {
        console.error('Error removing questions from template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Controller to delete a template
export const deleteTemplate = async (req, res) => {
    const { templateId } = req.params;

    try {
        // Delete all questions associated with the template
        await query(`
            DELETE FROM template_questions
            WHERE template_id = $1
        `, [templateId]);

        // Delete the template itself
        await query(`
            DELETE FROM templates
            WHERE template_id = $1
        `, [templateId]);

        res.status(200).json({ message: 'Template deleted successfully!' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
