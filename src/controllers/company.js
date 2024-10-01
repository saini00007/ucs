// controllers/company.js

import { query } from '../db/db.js'; // Import your query function

// Create Company
export const createCompany = async (req, res) => {
    console.log('Creating company...');
    const { company_name } = req.body; // Get company_name from request body
    const created_by = req.user.user_id; // Get created_by from req.user

    // Validate input
    if (!company_name || !created_by) {
        return res.status(400).json({ error: 'Company name and creator ID are required.' });
    }

    try {
        const result = await query(
            'INSERT INTO companies (company_name, created_by) VALUES ($1, $2) RETURNING *',
            [company_name, created_by]
        );

        const newCompany = result.rows[0];
        res.status(201).json({
            message: 'Company created successfully!',
            company: newCompany,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the company.' });
    }
};

// Get All Companies
export const getAllCompanies = async (req, res) => {
    try {
        const result = await query('SELECT * FROM companies');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching companies.' });
    }
};

// Get Specific Company by ID
export const getCompanyById = async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!id) {
        return res.status(400).json({ error: 'Company ID is required.' });
    }

    try {
        const result = await query('SELECT * FROM companies WHERE company_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the company.' });
    }
};
