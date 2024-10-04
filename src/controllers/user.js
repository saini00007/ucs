import { query } from '../db/db.js';
import sendEmail from '../utils/mailer.js';
import { generateToken } from '../utils/token.js'; // Use the token utility function
import bcrypt from 'bcrypt'; // Import bcrypt

// Add an admin to a specific company
export const addAdminToCompany = async (req, res) => {
  const { companyId } = req.params;
  const { username, password, email } = req.body; // Password will be hashed

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the admin role
    const role_id = 1;

    const result = await query(`
      INSERT INTO users (username, password, email, role_id, company_id) 
      VALUES ($1, $2, $3, $4, $5) RETURNING user_id
    `, [username, hashedPassword, email, role_id, companyId]);

    const userId = result.rows[0].user_id;

    // Generate a token for password setup
    const token = generateToken(userId);

    // Send email with password setup link
    const emailSubject = 'Set Your Admin Account Password';
    const emailText = `Hello ${username},\n\nYour admin account has been created successfully. Please set your password using the following link:\n\nhttp://localhost:3000/set-password?token=${token}\n\nPlease keep this information secure.`;

    await sendEmail(email, emailSubject, emailText);

    res.status(201).json({ message: 'Admin added successfully, password setup email sent', userId });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ message: 'Failed to add admin' });
  }
};

// Add a user to a specific department
export const addUserToDepartment = async (req, res) => {
  const { departmentId, companyId } = req.params;
  const { username, password, email, role_id } = req.body; // role_id for user can vary

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(`
      INSERT INTO users (username, password, email, role_id, department_id, company_id) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id
    `, [username, hashedPassword, email, role_id, departmentId, companyId]);

    const userId = result.rows[0].user_id;

    // Generate a token for password setup
    const token = generateToken(userId);

    // Send email with password setup link
    const emailSubject = 'Set Your Account Password';
    const emailText = `Hello ${username},\n\nYour account has been created successfully. Please set your password using the following link:\n\nhttp://localhost:3000/set-password?token=${token}\n\nPlease keep this information secure.`;

    await sendEmail(email, emailSubject, emailText);

    res.status(201).json({ message: 'User added to department successfully, password setup email sent', userId });
  } catch (error) {
    console.error('Error adding user to department:', error);
    res.status(500).json({ message: 'Failed to add user to department' });
  }
};
