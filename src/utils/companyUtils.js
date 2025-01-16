import { Company, ControlFramework, User } from '../models/index.js';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';

export const validateEmailForCompany = async (email, companyId = null) => {
    // Check the Company table for the email conflict
    const existingCompany = await Company.findOne({
        where: {
            [Op.or]: [
                { primaryEmail: email },
                { secondaryEmail: email }
            ],
            ...(companyId && { id: { [Op.ne]: companyId } })
        },
        paranoid: false
    });

    // Check the User table for the email conflict
    const existingUserEmail = await User.findOne({
        where: { email },
        paranoid: false
    });

    if (existingCompany) {
        return {
            isValid: false,
            message: 'Email already exists in another company'
        };
    }

    if (existingUserEmail) {
        return {
            isValid: false,
            message: 'Email is already in use by a user'
        };
    }

    return { isValid: true };
};

export const handleCompanyEmailUpdates = async (company, primaryEmail, secondaryEmail, transaction) => {
    const originalPrimaryEmail = company.primaryEmail;
    const originalSecondaryEmail = company.secondaryEmail;
    const emailUpdates = [];

    // If primary wants secondary's current email, update secondary first
    if (primaryEmail === originalSecondaryEmail) {
        if (!secondaryEmail) {
            throw new AppError('New secondary email required when swapping with primary', 400);
        }

        const secondaryEmailValidation = await validateEmailForCompany(secondaryEmail, company.id);
        if (!secondaryEmailValidation.isValid) {
            throw new AppError(`Secondary email ${secondaryEmailValidation.message}`, 400);
        }

        // Update secondary first
        const secondaryAdmin = await User.findOne({
            where: { email: originalSecondaryEmail, companyId: company.id, roleId: 'admin' },
            transaction,
        });
        if (secondaryAdmin) {
            secondaryAdmin.email = secondaryEmail;
            await secondaryAdmin.save({ transaction });
            emailUpdates.push('Secondary admin email updated');
        }

        // Then update primary
        const primaryAdmin = await User.findOne({
            where: { email: originalPrimaryEmail, companyId: company.id, roleId: 'admin' },
            transaction,
        });
        if (primaryAdmin) {
            primaryAdmin.email = primaryEmail;
            await primaryAdmin.save({ transaction });
            emailUpdates.push('Primary admin email updated');
        }

        company.secondaryEmail = secondaryEmail;
        company.primaryEmail = primaryEmail;
        return emailUpdates;
    }

    // If secondary wants primary's current email, update primary first
    if (secondaryEmail === originalPrimaryEmail) {
        if (!primaryEmail) {
            throw new AppError('New primary email required when swapping with secondary', 400);
        }

        const primaryEmailValidation = await validateEmailForCompany(primaryEmail, company.id);
        if (!primaryEmailValidation.isValid) {
            throw new AppError(`Primary email ${primaryEmailValidation.message}`, 400);
        }

        // Update primary first
        const primaryAdmin = await User.findOne({
            where: { email: originalPrimaryEmail, companyId: company.id, roleId: 'admin' },
            transaction,
        });
        if (primaryAdmin) {
            primaryAdmin.email = primaryEmail;
            await primaryAdmin.save({ transaction });
            emailUpdates.push('Primary admin email updated');
        }

        // Then update secondary
        const secondaryAdmin = await User.findOne({
            where: { email: originalSecondaryEmail, companyId: company.id, roleId: 'admin' },
            transaction,
        });
        if (secondaryAdmin) {
            secondaryAdmin.email = secondaryEmail;
            await secondaryAdmin.save({ transaction });
            emailUpdates.push('Secondary admin email updated');
        }

        company.primaryEmail = primaryEmail;
        company.secondaryEmail = secondaryEmail;
        return emailUpdates;
    }

    // Handle regular updates
    if (primaryEmail && primaryEmail !== originalPrimaryEmail) {
        const primaryEmailValidation = await validateEmailForCompany(primaryEmail, company.id);
        if (!primaryEmailValidation.isValid) {
            throw new AppError(`Primary email ${primaryEmailValidation.message}`, 400);
        }

        const primaryAdmin = await User.findOne({
            where: { email: originalPrimaryEmail, companyId: company.id, roleId: 'admin' },
            transaction,
        });
        if (primaryAdmin) {
            primaryAdmin.email = primaryEmail;
            await primaryAdmin.save({ transaction });
            emailUpdates.push('Primary admin email updated');
        }
        company.primaryEmail = primaryEmail;
    }

    if (secondaryEmail && secondaryEmail !== originalSecondaryEmail) {
        const secondaryEmailValidation = await validateEmailForCompany(secondaryEmail, company.id);
        if (!secondaryEmailValidation.isValid) {
            throw new AppError(`Secondary email ${secondaryEmailValidation.message}`, 400);
        }

        const secondaryAdmin = await User.findOne({
            where: { email: originalSecondaryEmail, companyId: company.id, roleId: 'admin' },
            transaction,
        });
        if (secondaryAdmin) {
            secondaryAdmin.email = secondaryEmail;
            await secondaryAdmin.save({ transaction });
            emailUpdates.push('Secondary admin email updated');
        }
        company.secondaryEmail = secondaryEmail;
    }

    return emailUpdates;
};

export const validateControlFrameworkIds = async (controlFrameworkIds) => {

    const existingFrameworks = await ControlFramework.findAll({
        where: {
            id: {
                [Op.in]: controlFrameworkIds
            }
        }
    });
  console.log(existingFrameworks);
  console.log(controlFrameworkIds);

    if (existingFrameworks.length !== controlFrameworkIds.length) {
        throw new AppError('One or more control frameworks not found', 404);
    }

}