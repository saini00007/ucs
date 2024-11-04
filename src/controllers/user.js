import { User, Department, Company } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import { generateToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

export const addUser = async (req, res) => {
    const { username, password, email, roleId, phoneNumber, departmentId } = req.body;
    const currentUser = req.user;

    if (roleId === 'superadmin') {
        return res.status(422).json({ success: false, messages: ['Invalid roleId'] });
    }

    if (currentUser.roleId != 'superadmin' && roleId === 'admin') {
        return res.status(403).json({ success: false, messages: ['Access denied: Only super admin can add admins'] });
    }

    if (roleId === 'admin') {
        const { companyId } = req.body;
        const company = await Company.findOne({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ success: false, messages: ['Company not found.'] });
        }
        return await createUser({ username, password, email, roleId, companyId, phoneNumber }, res);
    } else {
        const department = await Department.findOne({ where: { id: departmentId } });
        if (!department) {
            return res.status(404).json({ success: false, messages: ['Department not found.'] });
        }
        return await createUser({ username, password, email, roleId, departmentId, companyId: department.companyId, phoneNumber }, res);
    }
};

const createUser = async (userData, res) => {
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
            ...userData,
            password: hashedPassword,
        });

        const token = generateToken(user.id);
        const emailSubject = 'Set Your Account Password';
        const emailText = `Hello ${userData.username},\n\nYour account has been created successfully. Please set your password using the following link:\n\nhttp://localhost:4000/set-password?token=${token}\n\nPlease keep this information secure.`;

        await sendEmail(userData.email, emailSubject, emailText);

        res.status(201).json({ success: true, messages: ['User added successfully, password setup email sent'], userId: user.id });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, messages: ['Error adding user'], error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { username, email, roleId, departmentId, phoneNumber } = req.body;
    const currentUser = req.user;

    try {
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        if (roleId === 'admin' || roleId === 'superadmin') {
            return res.status(400).json({ success: false, messages: ['Cannot assign admin or superadmin roles.'] });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (departmentId) user.departmentId = departmentId;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (roleId) user.roleId = roleId;

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
        const deleted = await User.destroy({ where: { id: userId } });

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

        res.status(200).json({ success: true, users: users.length ? users : [], messages: users.length ? [] : ['No users found'] });
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

        res.status(200).json({ success: true, users: users.length ? users : [], messages: users.length ? [] : ['No users found'] });
    } catch (error) {
        console.error('Error fetching users by company:', error);
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
