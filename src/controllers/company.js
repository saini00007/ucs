import { query } from '../db/db.js';

// Create Company
export const createCompany = async (req, res) => {
    console.log('Creating company...');
    const { companyName } = req.body;
    const createdBy = req.user.userId; 

    if (!companyName || !createdBy) {
        return res.status(400).json({ error: 'Company name and creator ID are required.' });
    }

    try {
        const result = await query(
            'INSERT INTO companies (company_name, created_by) VALUES ($1, $2) RETURNING *',
            [companyName, createdBy]
        );

        const newCompany = result.rows[0];
        res.status(201).json({
            message: 'Company created successfully!',
            company: newCompany,
        });
        console.log("done!")
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the company.' });
    }
};

export const getAllCompanies = async (req, res) => {
    try {
        const result = await query('SELECT * FROM companies');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching companies.' });
    }
};

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
