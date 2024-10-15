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
  const { username, password, email, role_id ,phone_number,companyId, departmentId, } = req.body; // Accept role_id in body
  console.log(req.body);

  // Validate the username length
  if (username.length < 4) {
    return res.status(400).json({ message: 'Username must be at least 4 characters long.' });
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
      department_id:  departmentId,
      company_id: companyId,
      phone_number, // Include phone number in the user creation
    });

    const token = generateToken(userId);
    const emailSubject = 'Set Your Account Password';
    const emailText = `Hello ${username},\n\nYour account has been created successfully. Please set your password using the following link:\n\nhttp://localhost:3000/set-password?token=${token}\n\nPlease keep this information secure.`;

    await sendEmail(email, emailSubject, emailText);

    res.status(201).json({ message: ` User added successfully, password setup email sent`, userId });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Error adding user', error: error.message });
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
      return res.status(404).json({ message: 'User not found' });
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

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params; // Get user ID from the request parameters

  try {
    // Delete the user by user_id
    const deleted = await User.destroy({
      where: { user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(204).send(); // Respond with no content (204 status)
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
