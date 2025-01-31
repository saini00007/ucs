import { User, Company } from '../models/index.js';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';
import { ROLE_IDS } from './constants.js';


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
    if (roleId === ROLE_IDS.ADMIN && companyId) {
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
    if (targetRoleId === ROLE_IDS.SUPER_ADMIN) {
        throw new AppError('Cannot assign superadmin role', 403);
    }

    // Admin role validations
    if (currentUser.roleId === ROLE_IDS.ADMIN && targetRoleId === ROLE_IDS.ADMIN) {
        throw new AppError('Admin cannot add admin', 403);
    }


    // Role change validations
    if (existingRoleId) {
        if (existingRoleId !== targetRoleId) {
            throw new AppError('Cannot change existing role', 403);
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
        where: { companyId, roleId: ROLE_IDS.ADMIN }
    });

    if (existingAdmins.length >= 2) {
        throw new AppError('Only two admins are allowed for this company', 400);
    }

    return { isValid: true };
};