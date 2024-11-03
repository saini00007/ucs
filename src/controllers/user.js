import { User, Department } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import { generateToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

export const addUser = async (req, res) => {
    const { departmentId } = req.params;
    const { username, password, email, roleId, phoneNumber } = req.body;
    console.log(req.body);
    const currentUser = req.user;
    const department = await Department.findOne({ where: { id: departmentId } });
    if (!department) {
        return res.status(404).json({ success: false, messages: ['Department not found.'] });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            password: hashedPassword,
            email,
            roleId,
            departmentId,
            companyId: department.companyId,
            phoneNumber,
        });

        const token = generateToken(user.id);
        const emailSubject = 'Set Your Account Password';
        const emailText = `Hello ${username},\n\nYour account has been created successfully. Please set your password using the following link:\n\nhttp://localhost:4000/set-password?token=${token}\n\nPlease keep this information secure.`;

        await sendEmail(email, emailSubject, emailText);

        res.status(201).json({ success: true, messages: ['User added successfully, password setup email sent'], userId: user.id });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, messages: ['Error adding user'], error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { username, email, roleId, departmentId, phoneNumber } = req.body;

    try {
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (roleId) user.roleId = roleId;
        if (departmentId) user.departmentId = departmentId;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        await user.save();

        res.status(200).json({ success: true, messages: ['User updated successfully'] });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, messages: ['Error updating user'], error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const deleted = await User.destroy({
            where: { id: userId },
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

    try {
        const users = await User.findAll({
            where: { departmentId },
            attributes: ['id', 'username', 'roleId'],
        });

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                messages: ['No users found'],
                users: [],
            });
        }

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users by department:', error);
        res.status(500).json({ success: false, messages: ['Error fetching users'], error: error.message });
    }
};

export const getUsersByCompany = async (req, res) => {
    const { companyId } = req.params;

    try {
        const users = await User.findAll({
            where: { companyId },
            attributes: ['id', 'username', 'roleId'],
        });

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                messages: ['No users found'],
                users: [],
            });
        }

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users by company:', error);
        res.status(500).json({ success: false, messages: ['Error fetching users'], error: error.message });
    }
};

export const getUsersByRole = async (req, res) => {
    const { companyId, roleId } = req.params;

    try {
        const users = await User.findAll({
            where: {
                companyId,
                roleId,
            },
            attributes: ['id', 'username', 'roleId'],
        });

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                messages: ['No users found for this role'],
                users: [],
            });
        }

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users by role:', error);
        res.status(500).json({ success: false, messages: ['Error fetching users'], error: error.message });
    }
};

export const getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        const { password, ...userWithoutPassword } = user.get({ plain: true });

        res.status(200).json({
            success: true,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};
