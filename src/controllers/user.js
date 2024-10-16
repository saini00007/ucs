import { User } from '../models/index.js'; 
import sendEmail from '../utils/mailer.js'; 
import { generateToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

const generateUserId = (username) => {
  const prefix = username.substring(0, 4).toLowerCase();
  const randomDigits = Math.random().toString().slice(2, 10);
  return `${prefix}${randomDigits}`;
};

export const addUser = async (req, res) => {
  const { username, password, email, roleId, phoneNumber, companyId, departmentId } = req.body;

  if (roleId == '2') {
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

    const user = await User.create({
      user_id: userId,
      username,
      password: hashedPassword,
      email,
      role_id: roleId,
      department_id: departmentId,
      company_id: companyId,
      phone_number: phoneNumber,
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

export const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { username, email, roleId, departmentId, companyId, phoneNumber } = req.body;

  try {
    const user = await User.findOne({ where: { user_id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (roleId) user.role_id = roleId;
    if (departmentId) user.department_id = departmentId;
    if (companyId) user.company_id = companyId;
    if (phoneNumber) user.phone_number = phoneNumber;

    await user.save();

    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deleted = await User.destroy({
      where: { user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(204).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

export const getUsersByDepartment = async (req, res) => {
  const { departmentId } = req.params;
  const { roleId } = req.query;

  try {
    const whereClause = { department_id: departmentId };
    if (roleId) {
      whereClause.role_id = roleId;
    }

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

export const getUsersByCompany = async (req, res) => {
  const { companyId } = req.params;
  const { roleId } = req.query;

  try {
    const whereClause = { company_id: companyId };
    if (roleId) {
      whereClause.role_id = roleId;
    }

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

export const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
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
