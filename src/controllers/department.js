import { query } from '../db/db.js';

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

export const getDepartmentById = async (req, res) => {
  const { departmentId } = req.params;

  try {
    const result = await query(`
      SELECT d.department_id, d.department_name, c.company_name, c.company_id, d.master_department_id
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

export const createDepartment = async (req, res) => {
  const {companyId} =req.params;
  const { departmentName, masterDepartmentId } = req.body;

  try {
    // Validate that companyId exists
    const companyCheck = await query(
      'SELECT * FROM companies WHERE company_id = $1',
      [companyId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    // Validate that masterDepartmentId exists
    const masterDepartmentCheck = await query(
      'SELECT * FROM master_departments WHERE department_id = $1',
      [masterDepartmentId]
    );

    if (masterDepartmentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid master department ID' });
    }

    const result = await query(
      'INSERT INTO departments (department_name, company_id, master_department_id) VALUES ($1, $2, $3) RETURNING *',
      [departmentName, companyId, masterDepartmentId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};
