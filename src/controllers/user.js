import { query } from '../db/db.js';

// Add an admin to a specific company
export const addAdminToCompany = async (req, res) => {
  const { companyId } = req.params;
  const { username, password, email } = req.body; // Assume password is hashed before saving

  try {
    // Create a new user with the admin role (assume role_id for admin is known)
    const role_id = 7;

    const result = await query(`
      INSERT INTO users (username, password, email, role_id, company_id) 
      VALUES ($1, $2, $3, $4, $5) RETURNING user_id
    `, [username, password, email, role_id, companyId]);

    res.status(201).json({ message: 'Admin added successfully', userId: result.rows[0].user_id });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ message: 'Failed to add admin' });
  }
};

// Add a user to a specific department
export const addUserToDepartment = async (req, res) => {
  const { departmentId } = req.params;
  const { username, password, email, role_id } = req.body; // role_id for user can vary

  try {
    const result = await query(`
      INSERT INTO users (username, password, email, role_id, department_id) 
      VALUES ($1, $2, $3, $4, $5) RETURNING user_id
    `, [username, password, email, role_id, departmentId]);

    res.status(201).json({ message: 'User added to department successfully', userId: result.rows[0].user_id });
  } catch (error) {
    console.error('Error adding user to department:', error);
    res.status(500).json({ message: 'Failed to add user to department' });
  }
};
