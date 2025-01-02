
import { User, Company } from '../models/index.js';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';


export const validateEmailForUser = async (email, userId = null, roleId = null, companyId = null) => {
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

export const validateRoleAssignment = async (currentUser, targetRoleId, existingRoleId = null) => {
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

export const validateAdminAssignment = async (companyId) => {
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