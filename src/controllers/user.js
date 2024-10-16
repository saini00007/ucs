import { User } from '../models/index.js'; // Import the User model from index
import sendEmail from '../utils/mailer.js'; // This remains unchanged unless you want to also adjust this import
import { generateToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

// Function to generate an alphanumeric user ID
const generateUserId = (username) => {
  const prefix = username.substring(0, 4).toLowerCase();
  const randomDigits = Math.random().toString().slice(2, 10); // Get 8 random digits
  return `${prefix}${randomDigits}`; // Combine prefix and random digits
};

// Add a user (admin or regular) to a specific company or department
export const addUser = async (req, res) => {
  const { username, password, email, role_id, phone_number, companyId, departmentId } = req.body; // Accept role_id in body


  if (role_id == '2') {
    const adminCount = await User.count({
      where: {
        role_id: '2', 
        company_id: companyId
      }
    });

    if (adminCount >= 2) {
      return res.status(400).json({ success: false, message: 'A company can have a maximum of two admins.' });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId(username);

    // Create user using Sequelize
    const user = await User.create({
      user_id: userId,
      username,
      password: hashedPassword,
      email,
      role_id,
      department_id: departmentId,
      company_id: companyId,
      phone_number, // Include phone number in the user creation
    });

    const token = generateToken(userId);
    const emailSubject = 'Set Your Account Password';
    const emailText = `Hello ${username},\n\nYour account has been created successfully. Please set your password using the following link:\n\nhttp://localhost:3000/set-password?token=${token}\n\nPlease keep this information secure.`;

    await sendEmail(email, emailSubject, emailText);

    res.status(201).json({ success: true, message: 'User added successfully, password setup email sent', userId });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, message: 'Error adding user', error: error.message });
  }
};

// Update a user
export const updateUser = async (req, res) => {
  const { userId } = req.params; // Get user ID from the request parameters
  const { username, email, role_id, departmentId, companyId, phone_number } = req.body; // Include phone_number

  try {
    // Find the user by user_id
    const user = await User.findOne({ where: { user_id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (role_id) user.role_id = role_id;
    if (departmentId) user.department_id = departmentId;
    if (companyId) user.company_id = companyId;
    if (phone_number) user.phone_number = phone_number; // Update phone number if provided

    // Save the updated user
    await user.save();

    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const { userId } = req.params; // Get user ID from the request parameters

  try {
    // Delete the user by user_id
    const deleted = await User.destroy({
      where: { user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(204).json({ success: true, message: 'User deleted successfully' }); // Respond with success and message
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};


// Get all users by department with optional role filter
export const getUsersByDepartment = async (req, res) => {
  const { departmentId } = req.params; // Get department ID from the request parameters
  const { roleId } = req.query; // Get roleId from query parameters

  try {
    // Build the where clause for the query
    const whereClause = { department_id: departmentId }; // Start with the department filter
    if (roleId) {
      whereClause.role_id = roleId; // Add role filter if provided
    }

    // Fetch users belonging to the specified department and optional role
    const users = await User.findAll({ where: whereClause });

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found in this department' });
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users by department:', error);
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// Get all users by company with optional role filter
export const getUsersByCompany = async (req, res) => {
  const { companyId } = req.params; // Get company ID from the request parameters
  const { roleId } = req.query; // Get roleId from query parameters

  try {
    // Build the where clause for the query
    const whereClause = { company_id: companyId }; // Start with the company filter
    if (roleId) {
      whereClause.role_id = roleId; // Add role filter if provided
    }

    // Fetch users belonging to the specified company and optional role
    const users = await User.findAll({ where: whereClause });

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found in this company' });
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users by company:', error);
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

// Get user by ID (unchanged)
export const getUserById = async (req, res) => {
  const { userId } = req.params; // Get user ID from the request parameters

  try {
    // Find the user by user_id
    const user = await User.findOne({ where: { user_id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

