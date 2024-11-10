import { User, Department, Company } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import { generateToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

export const addUser = async (req, res) => {
    const { username, email, roleId, phoneNumber, departmentId, companyId } = req.body;
    const currentUser = req.user;
    const password = "root";

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, messages: ['Email already in use'] });
        }

        if (roleId === 'superadmin') {
            return res.status(422).json({ success: false, messages: ['Invalid roleId'] });
        }

        if (currentUser.roleId !== 'superadmin' && roleId === 'admin') {
            return res.status(403).json({ success: false, messages: ['Access denied: Only super admin can add admins'] });
        }

        if (roleId === 'admin') {
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
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};

const createUser = async (userData, res) => {
    try {

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
            ...userData,
            password: hashedPassword,
        });
        // console.log(user);
        const token = generateToken(user.id);
        const resetLink = `${process.env.CLIENT_URL}/set-password?token=${token}`;

        const emailSubject = 'Set Your Password';
        const emailText = `Hi ${userData.username},\n\nPlease set your password by clicking the link below:\n\n${resetLink}\n\nThe link expires in 15 minutes.`;

        await sendEmail(userData.email, emailSubject, emailText);


        const { password, ...userWithoutPassword } = user.get({ plain: true });

        res.status(201).json({
            success: true,
            messages: ['User added successfully, password setup email sent'],
            user: userWithoutPassword
        });
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

        if (roleId) {
            if (roleId === 'superadmin') {
                return res.status(400).json({ success: false, messages: ['Cannot assign superadmin role.'] });
            }
            if (roleId === 'admin' && user.roleId !== 'admin') {
                return res.status(400).json({ success: false, messages: ['Cannot assign admin role to this user.'] });
            }
            if (user.roleId === 'admin' && roleId !== 'admin') {
                return res.status(400).json({ success: false, messages: ['Cannot change admin role.'] });
            }
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (departmentId) user.departmentId = departmentId;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (roleId) user.roleId = roleId;

        await user.save();

        const { password, ...userWithoutPassword } = user.get({ plain: true });

        res.status(200).json({
            success: true,
            messages: ['User updated successfully'],
            user: userWithoutPassword,
        });
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

        res.status(200).json({ success: true, messages: ['User deleted successfully'] });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, messages: ['Error deleting user'], error: error.message });
    }
};

export const getUsersByDepartment = async (req, res) => {
    const { departmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const { count, rows: users } = await User.findAndCountAll({
            where: { departmentId },
            attributes: ['id', 'username', 'roleId', 'phoneNumber', 'email', 'companyId', 'departmentId'],
            limit: limit,
            offset: (page - 1) * limit,
        });

        if (count === 0) {
            return res.status(200).json({
                success: true,
                messages: ['No users found'],
                users: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    itemsPerPage: limit
                },
            });
        }

        const totalPages = Math.ceil(count / limit);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                messages: ['Page not found'],
            });
        }

        res.status(200).json({
            success: true,
            messages: ['Users retrieved successfully'],
            users: users, // Changed from 'Users' to 'users'
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            },
        });
    } catch (error) {
        console.error('Error fetching users by department:', error);
        res.status(500).json({
            success: false,
            messages: ['Error fetching users'],
            error: error.message,
        });
    }
};

export const getUsersByCompany = async (req, res) => {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const { count, rows: users } = await User.findAndCountAll({
            where: { companyId },
            attributes: ['id', 'username', 'roleId', 'phoneNumber', 'email', 'companyId', 'departmentId'],
            limit: limit,
            offset: (page - 1) * limit,
        });

        if (count === 0) {
            return res.status(200).json({
                success: true,
                messages: ['No users found'],
                users: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    itemsPerPage: limit
                },
            });
        }

        const totalPages = Math.ceil(count / limit);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                messages: ['Page not found'],
            });
        }

        res.status(200).json({
            success: true,
            messages: ['Users retrieved successfully'],
            users: users, // Changed from 'Users' to 'users'
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            },
        });
    } catch (error) {
        console.error('Error fetching users by company:', error);
        res.status(500).json({
            success: false,
            messages: ['Error fetching users'],
            error: error.message,
        });
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
            user: userWithoutPassword, // Changed from 'User' to 'user'
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};
