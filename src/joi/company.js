import Joi from 'joi';

const baseCompanySchema = Joi.object({
    companyName: Joi.string()
        .min(1)
        .max(255)
        .required()
        .messages({
            'string.empty': 'Company name cannot be empty',
            'string.max': 'Company name must be less than or equal to 255 characters',
            'any.required': 'Company name is required',
        }),

    postalAddress: Joi.string()
        .min(1)
        .max(255)
        .required()
        .messages({
            'string.empty': 'Postal address cannot be empty',
            'string.max': 'Postal address must be less than or equal to 255 characters',
            'any.required': 'Postal address is required',
        }),

    gstNumber: Joi.string()
        .length(15)
        .pattern(/^\d+$/)
        .required()
        .messages({
            'string.length': 'GST number must be exactly 15 digits',
            'string.pattern.base': 'GST number must contain only digits',
            'any.required': 'GST number is required',
        }),

    primaryEmail: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Primary email must be a valid email address',
            'any.required': 'Primary email is required',
        }),

    secondaryEmail: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Secondary email must be a valid email address',
        }),

    primaryPhone: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .required()
        .messages({
            'string.length': 'Primary phone must be exactly 10 digits',
            'string.pattern.base': 'Primary phone must contain only digits',
            'any.required': 'Primary phone is required',
        }),

    secondaryPhone: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .optional()
        .messages({
            'string.length': 'Secondary phone must be exactly 10 digits',
            'string.pattern.base': 'Secondary phone must contain only digits',
        }),
});

// Create schema for creating a company
const createCompanySchema = baseCompanySchema;

// Create schema for updating a company
const updateCompanySchema = Joi.object({
    companyName: Joi.string()
        .min(1)
        .max(255)
        .messages({
            'string.min': 'Company name must be at least 5 characters long',
            'string.max': 'Company name must be less than or equal to 255 characters',
        }),

    postalAddress: Joi.string()
        .max(255)
        .messages({
            'string.max': 'Postal address must be less than or equal to 255 characters',
        }),

    gstNumber: Joi.string()
        .length(15)
        .pattern(/^\d+$/)
        .messages({
            'string.length': 'GST number must be exactly 15 digits',
            'string.pattern.base': 'GST number must contain only digits',
        }),

    primaryEmail: Joi.string()
        .email()
        .messages({
            'string.email': 'Primary email must be a valid email address',
        }),

    secondaryEmail: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Secondary email must be a valid email address',
        }),

    primaryPhone: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .messages({
            'string.length': 'Primary phone must be exactly 10 digits',
            'string.pattern.base': 'Primary phone must contain only digits',
        }),

    secondaryPhone: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .optional()
        .messages({
            'string.length': 'Secondary phone must be exactly 10 digits',
            'string.pattern.base': 'Secondary phone must contain only digits',
        }),
});

export { createCompanySchema, updateCompanySchema };
