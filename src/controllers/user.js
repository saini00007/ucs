import { User, Department, Company, UserDepartmentLink } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import sendEmail from '../utils/mailer.js';
import generateToken from '../utils/token.js';
import bcrypt from 'bcrypt';
import AppError from '../utils/AppError.js';

const validateEmailForUser = async (email, userId = null, roleId = null, companyId = null) => {
    // Check existing user
    const existingUser = await User.findOne({
        where: {
            email,
            ...(userId && { id: { [Op.ne]: userId } })
        },
        paranoid: false
    });
 
    if (existingUser) {
        throw new AppError('Email already in use', 400);
    }
 
    // Admin email validation
    if (roleId === 'admin' && companyId) {
        const company = await Company.findByPk(companyId);
        if (!company) {
            throw new AppError('Company not found', 404);
        }
 
        if (![company.primaryEmail, company.secondaryEmail].includes(email)) {
            throw new AppError('Invalid email for admin role', 400);
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
            throw new AppError('Email already in use', 400);
        }
    }
 
    return { isValid: true };
 };

 const validateRoleAssignment = async (currentUser, targetRoleId, existingRoleId = null) => {
    // Superadmin validation
    if (targetRoleId === 'superadmin') {
        throw new AppError('Cannot assign superadmin role', 403);
    }
 
    // Admin role validations
    if (currentUser.roleId === 'admin' && targetRoleId === 'admin') {
        throw new AppError('Admin cannot add admin', 403);
    }
 
    // Department manager validations
    if (currentUser.roleId === 'departmentmanager' &&
        ['admin', 'departmentmanager'].includes(targetRoleId)) {
        throw new AppError('Department Manager cannot add admin or department manager', 403);
    }
 
    // Role change validations
    if (existingRoleId) {
        if (existingRoleId === 'admin' && targetRoleId !== 'admin') {
            throw new AppError('Cannot change admin role', 403);
        }
 
        if (targetRoleId === 'admin' && existingRoleId !== 'admin') {
            throw new AppError('Cannot assign admin role', 403);
        }
 
        if (existingRoleId === 'departmentmanager' && targetRoleId !== 'departmentmanager') {
            throw new AppError('Cannot change departmentmanager role', 403);
        }
 
        if (targetRoleId === 'departmentmanager' && existingRoleId !== 'departmentmanager') {
            throw new AppError('Cannot assign departmentmanager role', 403);
        }
    }
 
    return { isValid: true };
 };

const validateAdminAssignment = async (companyId) => {
   // Check if company exists
   const company = await Company.findByPk(companyId);
   if (!company) {
       throw new AppError('Company not found', 404);
   }

   // Check existing admins count
   const existingAdmins = await User.findAll({
       where: { companyId, roleId: 'admin' }
   });

   if (existingAdmins.length >= 2) {
       throw new AppError('Only two admins are allowed for this company', 400);
   }

   return { isValid: true };
};

const createUser = async (userData, res, next) => {
    const transaction = await sequelize.transaction();
    
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const { departmentId, ...trimmedUserData } = userData;

        const user = await User.create({
            ...trimmedUserData,
            password: hashedPassword,
        }, { transaction });

        if (departmentId) {
            const department = await Department.findByPk(departmentId);
            if (!department) {
                throw new AppError('Department not found', 404);
            }

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

        const token = generateToken(user.id, 'reset-password');
        const resetLink = `http://localhost:3000/set-password?token=${token}`;
        await sendEmail(
            userData.email,
            'Set Your Password',
            `Hi ${userData.username},\n\nPlease set your password by clicking the link below:\n\n${resetLink}\n\nThe link expires in 15 minutes.`
        );

        await transaction.commit();

        res.status(201).json({
            success: true,
            messages: ['User added successfully, password setup email sent'],
            user: userWithDepartments
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const addUser = async (req, res, next) => {
    const { username, email, roleId, phoneNumber, departmentId, companyId, countryCode } = req.body;
    const currentUser = req.user;
    const password = "root@7ji";

    try {
        // Since validation functions now throw AppError, we don't need to check isValid
        await validateEmailForUser(email, null, roleId, companyId);
        await validateRoleAssignment(currentUser, roleId);

        if (roleId === 'admin') {
            await validateAdminAssignment(companyId);
            // For admin role, create user with provided company
            await createUser({
                username,
                password,
                email,
                roleId,
                companyId,
                phoneNumber,
                countryCode
            }, res, next);
        } else {
            // For non-admin roles, check department exists
            const department = await Department.findOne({ where: { id: departmentId } });
            if (!department) {
                throw new AppError('Department not found', 404);
            }

            // For non-admin roles, create user with department's company
            await createUser({
                username,
                password,
                email,
                roleId,
                departmentId,
                companyId: department.companyId,
                phoneNumber,
                countryCode
            }, res, next);
        }

    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    const { userId } = req.params;
    const { username, email, roleId, phoneNumber } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const user = await User.findOne({ where: { id: userId }, transaction });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Email validation if email is being updated
        if (email && email !== user.email) {
            await validateEmailForUser(email, userId, roleId || user.roleId, user.companyId);
        }

        // Role validation if role is being updated
        if (roleId && roleId !== user.roleId) {
            await validateRoleAssignment(req.user, roleId, user.roleId);
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

        await transaction.commit();

        res.status(200).json({
            success: true,
            messages: ['User updated successfully'],
            user: updatedUser
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    const { userId } = req.params;
    const requestingUserRoleId = req.user.roleId;
    const transaction = await sequelize.transaction();

    try {
        // Fetch the user to be deleted
        const userToDelete = await User.findByPk(userId);

        if (!userToDelete) {
            throw new AppError('User not found', 404);
        }

        const userToDeleteRoleId = userToDelete.roleId;

        // Check if the requesting user has the right to delete the target user
        const canDelete =
            (requestingUserRoleId === 'superadmin') ||
            (requestingUserRoleId === 'admin' && ['departmentmanager', 'assessor', 'reviewer'].includes(userToDeleteRoleId)) ||
            (requestingUserRoleId === 'departmentmanager' && ['assessor', 'reviewer'].includes(userToDeleteRoleId));

        if (!canDelete) {
            throw new AppError('Unauthorized to delete this user', 403);
        }

        // Delete UserDepartmentLink records associated with the user
        await UserDepartmentLink.destroy({
            where: { userId },
            transaction
        });

        // Delete the user record
        await User.destroy({ 
            where: { id: userId }, 
            transaction 
        });

        await transaction.commit();

        res.status(200).json({ 
            success: true, 
            messages: ['User deleted successfully'] 
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Fetch user by primary key and include related departments
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id'],
                through: { attributes: [] },
            }]
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({ 
            success: true, 
            user 
        });

    } catch (error) {
        next(error);
    }
};

export const addUserToDepartment = async (req, res, next) => {
    try {
        const { userId, departmentId } = req.params;

        const department = await Department.findByPk(departmentId);
        if (!department) {
            throw new AppError('Department not found', 404);
        }

        const user = await User.findOne({
            where: {
                id: userId,
                companyId: department.companyId
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            throw new AppError('User must have a role of assessor or reviewer', 400);
        }

        // Check for existing link (including soft-deleted)
        const existingLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId },
            paranoid: false
        });

        if (existingLink) {
            // If link exists and not soft-deleted
            if (existingLink.deletedAt === null) {
                throw new AppError('User is already associated with this department', 409);
            }

            // Restore soft-deleted link
            await existingLink.restore();

            const updatedUser = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'deletedAt'] },
                include: [{
                    model: Department,
                    as: 'departments',
                    through: { attributes: [] },
                    attributes: ['id'],
                }]
            });

            return res.status(200).json({
                success: true,
                messages: ['User re-associated with department successfully'],
                user: updatedUser
            });
        }

        // Create new association
        await UserDepartmentLink.create({ userId, departmentId });

        // Fetch updated user data
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'deletedAt'] },
            include: [{
                model: Department,
                as: 'departments',
                through: { attributes: [] },
                attributes: ['id'],
            }]
        });

        res.status(200).json({
            success: true,
            messages: ['User added to department successfully'],
            user: updatedUser
        });

    } catch (error) {
        next(error);
    }
};

export const removeUserFromDepartment = async (req, res, next) => {
    try {
        const { userId, departmentId } = req.params;

        // Check if there is an existing link between the user and department
        const userDepartmentLink = await UserDepartmentLink.findOne({
            where: { userId, departmentId }
        });

        if (!userDepartmentLink) {
            throw new AppError('User is not associated with this department', 404);
        }

        // Fetch the user to check their role
        const user = await User.findByPk(userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if the user has a valid role
        if (!['assessor', 'reviewer'].includes(user.roleId)) {
            throw new AppError('User must have a role of assessor or reviewer', 400);
        }

        // Remove the user from the department
        await userDepartmentLink.destroy();

        res.status(200).json({
            success: true,
            messages: ['User removed from department successfully']
        });

    } catch (error) {
        next(error);
    }
};

export const getDepartmentsByUserId = async (req, res, next) => {
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
            throw new AppError('User not found', 404);
        }

        // Return response
        res.status(200).json({
            success: true,
            messages: user.departments.length === 0 
                ? ['No departments found for the user'] 
                : ['Departments retrieved successfully'],
            departments: user.departments
        });

    } catch (error) {
        console.error('Error fetching departments for user:', error);
        next(error);
    }
};
