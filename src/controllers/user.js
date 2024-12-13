import { User, Department, Company, UserDepartmentLink } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import sendEmail from '../utils/mailer.js';
import generateToken from '../utils/token.js';
import bcrypt from 'bcrypt';

const validateEmailForUser = async (email, userId = null, roleId = null, companyId = null) => {
    try {
        // Check existing user
        const existingUser = await User.findOne({
            where: {
                email,
                ...(userId && { id: { [Op.ne]: userId } })
            },
            paranoid: false
        });

        if (existingUser) {
            return { isValid: false, message: 'Email already in use' };
        }

        // Admin email validation
        if (roleId === 'admin' && companyId) {
            const company = await Company.findByPk(companyId);
            if (!company) {
                return { isValid: false, message: 'Company not found' };
            }

            if (![company.primaryEmail, company.secondaryEmail].includes(email)) {
                return { isValid: false, message: 'Invalid email for admin role' };
            }
        } else {
            // Non-admin email validations
            const existingCompanyEmail = await Company.findOne({
                where: {
                    [Op.or]: [
                        { primaryEmail: email },
                        { secondaryEmail: email }
                    ]
                },
                paranoid: false
            });

            if (existingCompanyEmail) {
                return { isValid: false, message: 'Email is already in use by a company' };
            }
        }

        return { isValid: true };
    } catch (error) {
        throw new Error('Error validating email: ' + error.message);
    }
};

const validateRoleAssignment = async (currentUser, targetRoleId, existingRoleId = null) => {
    try {
        // Superadmin validation
        if (targetRoleId === 'superadmin') {
            return { isValid: false, message: 'Cannot assign superadmin role' };
        }

        // Admin role validations
        if (currentUser.roleId === 'admin' && targetRoleId === 'admin') {
            return { isValid: false, message: 'Admin cannot add admin' };
        }

        // Department manager validations
        if (currentUser.roleId === 'departmentmanager' &&
            ['admin', 'departmentmanager'].includes(targetRoleId)) {
            return { isValid: false, message: 'Department Manager cannot add admin or department manager' };
        }

        // Role change validations
        if (existingRoleId) {
            if (existingRoleId === 'admin' && targetRoleId !== 'admin') {
                return { isValid: false, message: 'Cannot change admin role' };
            }

            if (targetRoleId === 'admin' && existingRoleId !== 'admin') {
                return { isValid: false, message: 'Cannot assign admin role' };
            }

            if (existingRoleId === 'departmentmanager' && targetRoleId !== 'departmentmanager') {
                return { isValid: false, message: 'Cannot change departmentmanager role' };
            }

            if (targetRoleId === 'departmentmanager' && existingRoleId !== 'departmentmanager') {
                return { isValid: false, message: 'Cannot assign departmentmanager role' };
            }
        }

        return { isValid: true };
    } catch (error) {
        throw new Error('Error validating role assignment: ' + error.message);
    }
};

 const validateAdminAssignment = async (companyId) => {
    try {
        const company = await Company.findByPk(companyId);
        if (!company) {
            return { isValid: false, message: 'Company not found' };
        }

        const existingAdmins = await User.findAll({
            where: { companyId, roleId: 'admin' }
        });

        if (existingAdmins.length >= 2) {
            return { isValid: false, message: 'Only two admins are allowed for this company' };
        }

        return { isValid: true };
    } catch (error) {
        throw new Error('Error validating admin assignment: ' + error.message);
    }
};

// Helper function to create user and send password reset email
const createUser = async (userData, res) => {
    const transaction = await sequelize.transaction();
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const { departmentId, ...trimmedUserData } = userData;

        const user = await User.create({
            ...trimmedUserData,
            password: hashedPassword,
        }, { transaction });

        if (departmentId) {
            await UserDepartmentLink.create({
                userId: user.id,
                departmentId
            }, { transaction });
        }

        const userWithDepartments = await User.findOne({
            where: { id: user.id },
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                through: { attributes: [] },
                attributes: ['id'],
            }],
            transaction
        });

        // Send password setup email
        const token = generateToken(user.id, 'reset-password');
        const resetLink = `http://localhost:3000/set-password?token=${token}`;
        await sendEmail(
            userData.email,
            'Set Your Password',
            `Hi ${userData.username},\n\nPlease set your password by clicking the link below:\n\n${resetLink}\n\nThe link expires in 15 minutes.`
        );

        // Commit the transaction
        await transaction.commit();

        return res.status(201).json({
            success: true,
            messages: ['User added successfully, password setup email sent'],
            user: userWithDepartments
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating user:', error);
        return res.status(500).json({
            success: false,
            messages: ['Error adding user'],
            error: error.message
        });
    }
};

export const addUser = async (req, res) => {
    const { username, email, roleId, phoneNumber, departmentId, companyId, countryCode } = req.body;
    const currentUser = req.user;
    const password = "root@7ji";

    try {
        // Email validation
        const emailValidation = await validateEmailForUser(email, null, roleId, companyId);
        if (!emailValidation.isValid) {
            return res.status(409).json({
                success: false,
                messages: [emailValidation.message]
            });
        }

        // Role validation
        const roleValidation = await validateRoleAssignment(currentUser, roleId);
        if (!roleValidation.isValid) {
            return res.status(403).json({
                success: false,
                messages: [roleValidation.message]
            });
        }

        // Admin validation 
        if (roleId === 'admin') {
            const adminValidation = await validateAdminAssignment(companyId);
            if (!adminValidation.isValid) {
                return res.status(422).json({
                    success: false,
                    messages: [adminValidation.message]
                });
            }
        } else {
            // For non-admin roles, check department exists
            const department = await Department.findOne({ where: { id: departmentId } });
            if (!department) {
                return res.status(404).json({
                    success: false,
                    messages: ['Department not found']
                });
            }

            // For non-admin roles, create user with department's company
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

        // For admin role, create user with provided company
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
        res.status(500).json({
            success: false,
            messages: ['Server error']
        });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { username, email, roleId, phoneNumber } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const user = await User.findOne({ where: { id: userId }, transaction });
        if (!user) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                messages: ['User not found']
            });
        }

        // Email validation if email is being updated
        if (email && email !== user.email) {
            const emailValidation = await validateEmailForUser(email, userId, roleId || user.roleId, user.companyId);
            if (!emailValidation.isValid) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    messages: [emailValidation.message]
                });
            }
        }

        // Role validation if role is being updated
        if (roleId && roleId !== user.roleId) {
            const roleValidation = await validateRoleAssignment(req.user, roleId, user.roleId);
            if (!roleValidation.isValid) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    messages: [roleValidation.message]
                });
            }
        }

        // Update user fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (roleId) user.roleId = roleId;

        await user.save({ transaction });

        // Fetch updated user with departments
        const updatedUser = await User.findOne({
            where: { id: userId },
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                through: { attributes: [] },
                attributes: ['id'],
            }],
            transaction
        });

        // Commit the transaction
        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['User updated successfully'],
            user: updatedUser
        });

    } catch (error) {
        await transaction.rollback(); 
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            messages: ['Error updating user'],
            error: error.message
        });
    }
};

export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const requestingUserRoleId = req.user.roleId;

    const transaction = await sequelize.transaction();

    try {
        // Fetch the user to be deleted
        const userToDelete = await User.findByPk(userId);

        if (!userToDelete) {
            await transaction.rollback();
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        const userToDeleteRoleId = userToDelete.roleId;

        // Check if the requesting user has the right to delete the target user
        const canDelete =
            (requestingUserRoleId === 'superadmin') ||
            (requestingUserRoleId === 'admin' && ['departmentmanager', 'assessor', 'reviewer'].includes(userToDeleteRoleId)) ||
            (requestingUserRoleId === 'departmentmanager' && ['assessor', 'reviewer'].includes(userToDeleteRoleId));

        if (!canDelete) {
            await transaction.rollback();
            return res.status(403).json({ success: false, messages: ['Unauthorized to delete this user'] });
        }

        // Delete UserDepartmentLink records associated with the user
        await UserDepartmentLink.destroy({
            where: { userId },
            transaction
        });

        // Delete the user record
        const deleted = await User.destroy({ where: { id: userId }, transaction });

        if (!deleted) {
            await transaction.rollback();
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        // Commit the transaction if all deletions succeeded
        await transaction.commit();
        res.status(200).json({ success: true, messages: ['User deleted successfully'] });
    } catch (error) {
        // Rollback the transaction in case of any error
        await transaction.rollback();
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, messages: ['Error deleting user'] });
    }
};

export const getUserById = async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch user by primary key and include related departments
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] }, // Exclude sensitive data
            include: [{
                model: Department, // Include the associated departments
                as: 'departments',
                attributes: ['id'], // Only return department IDs
                through: { attributes: [] }, // Exclude join table attributes
            }]
        });

        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        // Return user data
        res.status(200).json({ success: true, user });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};

export const addUserToDepartment = async (req, res) => {
    const { userId, departmentId } = req.params;

    try {
        // Fetch the user and department by their IDs
        const user = await User.findByPk(userId);
        const department = await Department.findByPk(departmentId);

        // If either the user or department is not found, return 404
        if (!user || !department) {
            return res.status(404).json({
                success: false,
                messages: ['User or department not found']
            });
        }

        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            return res.status(400).json({
                success: false,
                messages: ['User must have a role of assessor or reviewer']
            });
        }

        // Check if the user belongs to the same company as the department
        if (user.companyId !== department.companyId) {
            return res.status(400).json({
                success: false,
                messages: ['User does not belong to the same company as the department']
            });
        }

        // Check if the user is already linked to the department (even soft-deleted links)
        const existingLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId },
            paranoid: false // Include soft-deleted records
        });

        if (existingLink) {
            // If the link exists and is not soft-deleted, return a conflict response
            if (existingLink.deletedAt === null) {
                return res.status(409).json({
                    success: false,
                    messages: ['User is already associated with this department']
                });
            } else {
                // Restore the soft-deleted link if it exists
                await existingLink.restore();

                // Fetch the updated user with department association
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

        // If no existing link, create a new user-department association
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
        // Handle unexpected errors and log them
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
        // Check if there is an existing link between the user and department
        const userDepartmentLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId }
        });

        // If no such link exists, return a 404 response
        if (!userDepartmentLink) {
            return res.status(404).json({
                success: false,
                messages: ['User is not associated with this department']
            });
        }

        // Fetch the user to check their role
        const user = await User.findByPk(userId);

        // If user not found, return a 404 response
        if (!user) {
            return res.status(404).json({
                success: false,
                messages: ['User not found']
            });
        }

        // Check if the user has a valid role (either assessor or reviewer)
        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            return res.status(400).json({
                success: false,
                messages: ['User must have a role of assessor or reviewer']
            });
        }

        // If everything is valid, remove the user from the department by destroying the link
        await userDepartmentLink.destroy();

        // Return a success response
        res.status(200).json({
            success: true,
            messages: ['User removed from department successfully']
        });
    } catch (error) {
        // Handle any errors that occur during the process
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
        // Fetch the user along with their associated departments
        const user = await User.findByPk(userId, {
            include: [{
                model: Department, // Include the departments associated with the user
                as: 'departments',
                attributes: ['id', 'departmentName'],
                through: {
                    attributes: [] // Exclude the join table attributes (no need to include them)
                }
            }]
        });

        // If no user is found, return a 404 response
        if (!user) {
            return res.status(404).json({ success: false, messages: ['User not found'] });
        }

        // Return the user and their associated departments
        res.status(200).json({
            success: true,
            userId: user.id,
            departments: user.departments
        });

    } catch (error) {
        // Catch any errors that occur during the process
        console.error('Error fetching user departments:', error);
        res.status(500).json({ success: false, messages: ['Server error'] });
    }
};
