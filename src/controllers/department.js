import { query } from '../db/db.js';

// Get all departments for a specific company
export const getAllDepartmentsForCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    const result = await query(
      'SELECT * FROM departments WHERE company_id = $1',
      [companyId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching departments for company:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Get a single department by ID, including the company name
export const getDepartmentById = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const result = await query(`
      SELECT d.department_id, d.department_name, c.company_name,c.company_id
      FROM departments d
      JOIN companies c ON d.company_id = c.company_id
      WHERE d.department_id = $1
    `, [departmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

// Create a new department within a specific company
export const createDepartment = async (req, res) => {
  const { department_name, company_id } = req.body;

  try {
    const result = await query(
      'INSERT INTO departments (department_name, company_id) VALUES ($1, $2) RETURNING *',
      [department_name, company_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};
