import { User, Department } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import { generateToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

export const addUser = async (req, res) => {
    const { username, password, email, roleId, phoneNumber, companyId, departmentId } = req.body;

    const currentUser = req.user;

    const department = await Department.findOne({ where: { departmentId: departmentId } });
    if (!department) {
        return res.status(404).json({ success: false, messages: ['Department not found.'] });
    }

    if (department.companyId !== companyId) {
        return res.status(403).json({ success: false, messages: ['Department does not belong to the specified company.'] });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            password: hashedPassword,
            email,
            roleId,
            departmentId,
            companyId,
            phoneNumber,
        });

        const token = generateToken(user.userId);
        const emailSubject = 'Set Your Account Password';
        const emailText = `Hello ${username},\n\nYour account has been created successfully. Please set your password using the following link:\n\nhttp://localhost:3000/set-password?token=${token}\n\nPlease keep this information secure.`;

        await sendEmail(email, emailSubject, emailText);

        res.status(201).json({ success: true, messages: ['User added successfully, password setup email sent'], userId: user.userId });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, messages: ['Error adding user'], error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { username, email, roleId, departmentId, phoneNumber } = req.body;

    try {
        const user = await User.findOne({ where: { user_id: userId } });

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (roleId) user.roleId = roleId;
        if (departmentId) user.departmentId = departmentId;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        await user.save();

        res.status(200).json({ success: true, messages: ['User updated successfully']});
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, messages: ['Error updating user'], error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const deleted = await User.destroy({
            where: { user_id: userId },
        });

        if (!deleted) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        res.status(204).json({ success: true, messages: ['User deleted successfully'] });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, messages: ['Error deleting user'], error: error.message });
    }
};

export const getUsersByDepartment = async (req, res) => {
    const { departmentId } = req.params;
    const { page = 1, limit = 10 } = req.query; // Pagination parameters

    const offset = (page - 1) * limit; // Calculate offset for pagination

    try {
        const { count, rows: users } = await User.findAndCountAll({
            where: { departmentId },
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: ['user_id', 'username', 'roleId'], // Select only user ID, username, and role ID
        });

        if (users.length === 0) {
            return res.status(404).json({ success: false, messages: ['No users found in this department'] });
        }

        const totalPages = Math.ceil(count / limit); // Calculate total pages

        res.status(200).json({ success: true, users, totalPages, currentPage: page });
    } catch (error) {
        console.error('Error fetching users by department:', error);
        res.status(500).json({ success: false, messages: ['Error fetching users'], error: error.message });
    }
};

export const getUsersByCompany = async (req, res) => {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query; // Pagination parameters

    const offset = (page - 1) * limit; // Calculate offset for pagination

    try {
        const { count, rows: users } = await User.findAndCountAll({
            where: { companyId },
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: ['user_id', 'username', 'roleId'], // Select only user ID, username, and role ID
        });

        if (users.length === 0) {
            return res.status(404).json({ success: false, messages: ['No users found in this company'] });
        }

        const totalPages = Math.ceil(count / limit); // Calculate total pages

        res.status(200).json({ success: true, users, totalPages, currentPage: page });
    } catch (error) {
        console.error('Error fetching users by company:', error);
        res.status(500).json({ success: false, messages: ['Error fetching users'], error: error.message });
    }
};

export const getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findOne({ where: { userId } });

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        const { password, ...userWithoutPassword } = user.get();

        res.status(200).json({
            success: true,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};
