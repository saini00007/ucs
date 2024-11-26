import { User, Department, Company, UserDepartmentLink } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import { generateToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

export const addUser = async (req, res) => {
    const { username, email, roleId, phoneNumber, departmentId, companyId, countryCode } = req.body;
    const currentUser = req.user;
    const password = "root";

    try {
        // Check if email already exists
        const existingUser = await User.findOne({
            where: { email },
            paranoid: false
        });

        if (existingUser) {
            return res.status(409).json({ success: false, messages: ['Email already in use'] });
        }

        // Validate that superadmin cannot be assigned here
        if (roleId === 'superadmin') {
            return res.status(422).json({ success: false, messages: ['Invalid roleId'] });
        }

        if (currentUser.roleId === 'admin' && (roleId === 'admin')) {
            return res.status(403).json({ success: false, messages: ['Admin cannot add admin'] });
        }

        if (currentUser.roleId === 'departmentmanager' && ['admin', 'departmentmanager'].includes(roleId)) {
            return res.status(403).json({ success: false, messages: ['Department Manager cannot add admin, or department manager'] });
        }

        // For admin roles, perform additional checks (if roleId is admin)
        if (roleId === 'admin') {
            const company = await Company.findOne({ where: { id: companyId } });
            if (!company) {
                return res.status(404).json({ success: false, messages: ['Company not found.'] });
            }

            // Ensure the company allows only two admins
            const existingAdmins = await User.findAll({ where: { companyId, roleId: 'admin' } });
            if (existingAdmins.length >= 2) {
                return res.status(422).json({ success: false, messages: ['Only two admins are allowed for this company.'] });
            }

            // Validate that the admin email matches the company admin emails
            if (![company.primaryEmail, company.secondaryEmail].includes(email)) {
                return res.status(403).json({ success: false, messages: ['Invalid email for admin role.'] });
            }
        }

        // For non-admin roles, check department and company email restrictions
        if (roleId !== 'admin') {
            const department = await Department.findOne({ where: { id: departmentId } });
            if (!department) {
                return res.status(404).json({ success: false, messages: ['Department not found.'] });
            }

            const company = await Company.findOne({ where: { id: department.companyId } });
            if (!company) {
                return res.status(404).json({ success: false, messages: ['Company associated with department not found.'] });
            }

            // Ensure the user's email does not match the company's primary or secondary email
            if (currentUser.roleId !== 'admin' && [company.primaryEmail, company.secondaryEmail].includes(email)) {
                return res.status(403).json({ success: false, messages: ['Email cannot match the company admin emails.'] });
            }

            // Proceed with user creation with department and company details
            return await createUser({
                username,
                password,
                email,
                roleId,
                departmentId,
                companyId: department.companyId,
                phoneNumber,
                countryCode
            }, res);
        }

        // For admin role, create user with companyId
        return await createUser({
            username,
            password,
            email,
            roleId,
            companyId,
            phoneNumber,
            countryCode
        }, res);

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
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [
                {
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] },
                    attributes: ['id'],
                }
            ]
        });

        const token = generateToken(user.id, 'reset-password');
        const resetLink = `${process.env.CLIENT_URL}/set-password?token=${token}`;

        const emailSubject = 'Set Your Password';
        const emailText = `Hi ${userData.username},\n\nPlease set your password by clicking the link below:\n\n${resetLink}\n\nThe link expires in 15 minutes.`;

        await sendEmail(userData.email, emailSubject, emailText);

        res.status(201).json({
            success: true,
            messages: ['User added successfully, password setup email sent'],
            user: userWithDepartments
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

        if (email && email !== user.email) {
            // Check if the new email is already taken by another user
            const existingUser = await User.findOne({
                where: { email },
                paranoid: false
            });

            if (existingUser) {
                return res.status(400).json({ success: false, messages: ['Email is already in use by another user.'] });
            }

            // Check if the user is an admin, if not, ensure the email is not the company's email
            if (roleId !== 'admin') {
                const companyId = user.companyId;
                const company = await Company.findOne({ where: { id: companyId } });
                if (!company) {
                    return res.status(404).json({ success: false, messages: ['Company not found.'] });
                }

                if ([company.primaryEmail, company.secondaryEmail].includes(email)) {
                    return res.status(400).json({ success: false, messages: ['Email cannot match the company admin emails.'] });
                }
            }
        }

        // Check for invalid role assignments
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

            // Prevent assigning departmentmanager role
            if (roleId === 'departmentmanager' && user.roleId !== 'departmentmanager') {
                return res.status(400).json({ success: false, messages: ['Cannot assign departmentmanager role.'] });
            }

            // Prevent changing role if the user is already a departmentmanager
            if (user.roleId === 'departmentmanager' && roleId !== 'departmentmanager') {
                return res.status(400).json({ success: false, messages: ['Cannot change departmentmanager role.'] });
            }
        }

        // Update user details
        if (username) user.username = username;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (roleId) user.roleId = roleId;

        await user.save();

        const updatedUser = await User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [
                {
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] },
                    attributes: ['id'],
                }
            ]
        });

        res.status(200).json({
            success: true,
            messages: ['User updated successfully'],
            user: updatedUser
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

export const getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
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

        // Check if the user is already linked to the department (even if soft-deleted)
        const existingLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId },
            paranoid: false // Include soft-deleted records
        });

        if (existingLink) {
            if (existingLink.deletedAt === null) {
                // If the link exists and is not soft-deleted, return a message saying the user is already associated
                return res.status(409).json({
                    success: false,
                    messages: ['User is already associated with this department']
                });
            } else {
                // If the link exists but is soft-deleted, restore it
                await existingLink.restore();

                // After restoring, fetch the updated user again to include the department association
                const updatedUser = await User.findByPk(userId, {
                    attributes: { exclude: ['password', 'deletedAt'] },
                    include: [
                        {
                            model: Department,
                            as: 'departments',
                            through: { attributes: [] },
                            attributes: ['id'],
                        }
                    ]
                });

                return res.status(200).json({
                    success: true,
                    messages: ['User re-associated with department successfully'],
                    user: updatedUser
                });
            }
        }

        // If no existing link, create a new one
        await UserDepartmentLink.create({ userId, departmentId });

        // Fetch the updated user data after association
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [
                {
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] },
                    attributes: ['id'],
                }
            ]
        });

        res.status(200).json({
            success: true,
            messages: ['User added to department successfully'],
            user: updatedUser
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
        // Fetch the UserDepartmentLink to check if user is associated with the department
        const userDepartmentLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId }
        });

        if (!userDepartmentLink) {
            return res.status(404).json({
                success: false,
                messages: ['User is not associated with this department']
            });
        }

        // Fetch the user to get their role
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                messages: ['User not found']
            });
        }

        // Check if the user has the required role
        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            return res.status(400).json({
                success: false,
                messages: ['User must have a role of assessor or reviewer']
            });
        }

        // Remove the user from the department
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

export const getDepartmentsByUserId = async (req, res) => {
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
