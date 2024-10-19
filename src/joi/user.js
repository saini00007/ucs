import Joi from 'joi';

const userSchema = Joi.object({
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
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
        .required()
        .messages({
            'string.base': 'Password must be a string.',
            'string.empty': 'Password is required.',
            'string.min': 'Password must be at least 8 characters long.',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.',
            'any.required': 'Password is required.'
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
        .required()
        .messages({
            'string.base': 'Role ID must be a string.',
            'string.empty': 'Role ID is required.',
            'any.required': 'Role ID is required.'
        }),
    departmentId: Joi.string()
        .uuid()
        .optional()
        .messages({
            'string.base': 'Department ID must be a string.',
            'string.uuid': 'Department ID must be a valid UUID.'
        }),
    companyId: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.base': 'Company ID must be a string.',
            'string.empty': 'Company ID is required.',
            'string.uuid': 'Company ID must be a valid UUID.',
            'any.required': 'Company ID is required.'
        }),
    phoneNumber: Joi.string()
        .length(10)
        .required()
        .messages({
            'string.base': 'Phone number must be a string.',
            'string.empty': 'Phone number is required.',
            'string.length': 'Phone number must be exactly 10 characters long.',
            'any.required': 'Phone number is required.'
        }),
});

// User Update Schema
const userUpdateSchema = Joi.object({
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
    roleId: Joi.string()
        .optional()
        .messages({
            'string.base': 'Role ID must be a string.',
            'string.empty': 'Role ID cannot be empty.',
        }),
    departmentId: Joi.string()
        .uuid()
        .optional()
        .messages({
            'string.base': 'Department ID must be a string.',
            'string.uuid': 'Department ID must be a valid UUID.',
        }),

    phoneNumber: Joi.string()
        .length(10)
        .optional()
        .messages({
            'string.base': 'Phone number must be a string.',
            'string.empty': 'Phone number cannot be empty.',
            'string.length': 'Phone number must be exactly 10 characters long.',
        }),
});

export { userSchema, userUpdateSchema };
