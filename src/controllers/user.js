import { User, Department, Company } from '../models/index.js';
import UserDepartmentLink from '../models/UserDepartmentLink.js';
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

            const existingAdmins = await User.findAll({ where: { companyId, roleId: 'admin' } });
            if (existingAdmins.length >= 2) {
                return res.status(422).json({ success: false, messages: ['Only two admins are allowed for this company.'] });
            }

            if (![company.primaryEmail, company.secondaryEmail].includes(email)) {
                return res.status(403).json({ success: false, messages: ['Invalid email for admin role.'] });
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
        const { departmentId, ...trimmedUserData } = userData;

        const user = await User.create({
            ...trimmedUserData,
            password: hashedPassword,
        });

        if (departmentId) {
            await UserDepartmentLink.create({ userId: user.id, departmentId });
        }

        const userWithDepartments = await User.findOne({
            where: { id: user.id },
            include: [
                {
                    model: Department,
                    as: 'departments',
                    attributes: ['id'],
                }
            ]
        });

        const token = generateToken(user.id, 'reset-password');
        const resetLink = `${process.env.CLIENT_URL}/set-password?token=${token}`;

        const emailSubject = 'Set Your Password';
        const emailText = `Hi ${userData.username},\n\nPlease set your password by clicking the link below:\n\n${resetLink}\n\nThe link expires in 15 minutes.`;

        await sendEmail(userData.email, emailSubject, emailText);

        const { password, ...userWithoutPassword } = userWithDepartments.get({ plain: true });

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
    const { username, email, roleId, phoneNumber } = req.body;

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

            if (roleId === 'admin') {
                const companyId = user.companyId;
                const company = await Company.findOne({ where: { id: companyId } });
                if (!company) {
                    return res.status(404).json({ success: false, messages: ['Company not found.'] });
                }

                if (![company.primaryEmail, company.secondaryEmail].includes(email)) {
                    return res.status(403).json({ success: false, messages: ['Email must be one of the company admin emails.'] });
                }
            }
        }

        if (username) user.username = username;
        if (email) user.email = email;
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
            include: [
                {
                    model: Department,
                    as: 'departments',
                    attributes: ['id'],
                    through: {
                        attributes: []
                    },
                    where: departmentId ? { id: departmentId } : {},
                },
            ],
            attributes: ['id', 'username', 'roleId', 'phoneNumber', 'email', 'companyId'],
            limit: parseInt(limit, 10),
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
            users: users,
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
            attributes: ['id', 'username', 'roleId', 'phoneNumber', 'email', 'companyId'],
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id'],
                through: {
                    attributes: []
                },
            }],
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
            users: users,
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
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'roleId', 'phoneNumber', 'companyId'],
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id'],
                through: {
                    attributes: []
                },
            }]
        });
        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }
        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};

export const addUserToDepartment = async (req, res) => {
    const { userId, departmentId } = req.params;

    try {
        const user = await User.findByPk(userId);
        const department = await Department.findByPk(departmentId);

        if (!user || !department) {
            return res.status(404).json({
                success: false,
                messages: ['User or department not found']
            });
        }
        if (user.companyId !== department.companyId) {
            return res.status(400).json({
                success: false,
                messages: ['User does not belong to the same company as the department']
            });
        }

        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            return res.status(400).json({
                success: false,
                messages: ['User must have a role of assessor or reviewer']
            });
        }

        const existingLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId }
        });

        if (existingLink) {
            return res.status(409).json({
                success: false,
                messages: ['User is already associated with this department']
            });
        }

        await UserDepartmentLink.create({ userId, departmentId });

        res.status(200).json({
            success: true,
            messages: ['User added to department successfully']
        });
    } catch (error) {
        console.error('Error adding user to department:', error);
        res.status(500).json({
            success: false,
            messages: ['Server error'],
            error: error.message
        });
    }
};

export const removeUserFromDepartment = async (req, res) => {
    const { userId, departmentId } = req.params;

    try {

        const userDepartmentLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId }
        });

        if (!userDepartmentLink) {
            return res.status(404).json({
                success: false,
                messages: ['User is not associated with this department']
            });
        }
        await userDepartmentLink.destroy();

        res.status(200).json({
            success: true,
            messages: ['User removed from department successfully']
        });
    } catch (error) {
        console.error('Error removing user from department:', error);
        res.status(500).json({
            success: false,
            messages: ['Server error'],
            error: error.message
        });
    }
};

export const getDepartmentsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId, {
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id', 'departmentName'],
                through: {
                    attributes: []
                }
            }]
        });

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        res.status(200).json({
            success: true,
            userId: user.id,
            departments: user.departments
        });

    } catch (error) {
        console.error('Error fetching user departments:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};
