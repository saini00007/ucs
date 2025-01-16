import Joi from 'joi';
import { ROLE_IDS } from '../utils/constants';
const validRoleValues = Object.values(ROLE_IDS).filter(
    role => role !== ROLE_IDS.SUPER_ADMIN
);

const baseUserSchema = Joi.object({
    username: Joi.string()
        .min(1)
        .max(255)
        .required()
        .messages({
            'string.base': 'Username must be a string.',
            'string.empty': 'Username is required.',
            'string.min': 'Username must be at least 1 character long.',
            'string.max': 'Username must be at most 255 characters long.',
            'any.required': 'Username is required.'
        }),
    email: Joi.string()
        .email()
        .max(100)
        .required()
        .messages({
            'string.base': 'Email must be a string.',
            'string.empty': 'Email is required.',
            'string.email': 'Email must be a valid email address.',
            'string.max': 'Email must be at most 100 characters long.',
            'any.required': 'Email is required.'
        }),
    roleId: Joi.string()
        .valid(...validRoleValues)
        .required()
        .messages({
            'string.base': 'Role ID must be a string.',
            'string.empty': 'Role ID is required.',
            'any.required': 'Role ID is required.'
        }),
    phoneNumber: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .required()
        .messages({
            'string.base': 'Phone number must be a string.',
            'string.empty': 'Phone number is required.',
            'string.length': 'Phone number must be exactly 10 digits long.',
            'string.pattern.base': 'Phone number must contain only digits.',
            'any.required': 'Phone number is required.'
        }),
    departmentId: Joi.string()
        .when(Joi.ref('roleId'), {
            is: Joi.string().valid('admin', 'leadership'),
            then: Joi.optional(),
            otherwise: Joi.required()
        })
        .messages({
            'string.base': 'Department ID must be a string.',
            'string.empty': 'Department ID is required.',
            'any.required': 'Department ID is required.'
        }),

    companyId: Joi.string()
        .when(Joi.ref('roleId'), {
            is: Joi.string().valid('admin', 'leadership'),
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.base': 'Company ID must be a string.',
            'string.empty': 'Company ID is required.',
            'any.required': 'Company ID is required.'
        }),

    countryCode: Joi.string()
        .min(1)
        .max(5)
        .required()
        .allow('')
        .pattern(/^\+?\d+$/)
        .messages({
            'string.min': 'Country code must be between 1 and 5 characters',
            'string.max': 'Country code must be between 1 and 5 characters',
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),
});

const createUserSchema = baseUserSchema;

const updateUserSchema = Joi.object({
    username: Joi.string()
        .min(1)
        .max(255)
        .optional()
        .messages({
            'string.base': 'Username must be a string.',
            'string.empty': 'Username cannot be empty.',
            'string.min': 'Username must be at least 1 character long.',
            'string.max': 'Username must be at most 255 characters long.',
        }),
    email: Joi.string()
        .email()
        .max(100)
        .optional()
        .messages({
            'string.base': 'Email must be a string.',
            'string.empty': 'Email cannot be empty.',
            'string.email': 'Email must be a valid email address.',
            'string.max': 'Email must be at most 100 characters long.',
        }),
    countryCode: Joi.string()
        .min(1)
        .max(5)
        .optional()
        .pattern(/^\+?\d+$/)
        .messages({
            'string.min': 'Country code must be between 1 and 5 characters',
            'string.max': 'Country code must be between 1 and 5 characters',
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),
    roleId: Joi.string()
        .valid(...validRoleValues)
        .optional()
        .messages({
            'string.base': 'Role ID must be a string.',
            'string.empty': 'Role ID cannot be empty.',
        }),
    phoneNumber: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .optional()
        .messages({
            'string.base': 'Phone number must be a string.',
            'string.empty': 'Phone number cannot be empty.',
            'string.length': 'Phone number must be exactly 10 digits long.',
            'string.pattern.base': 'Phone number must contain only digits.',
        })
});

export { createUserSchema, updateUserSchema };
