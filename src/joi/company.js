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

    panNumber: Joi.string()
        .length(10)
        .required()
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .messages({
            'string.length': 'PAN number must be exactly 10 characters',
            'string.pattern.base': 'PAN number must match the pattern XXXXX1234X',
        }),

    industrySectorId: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Industry sector ID must be a valid UUID',
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
    controlFrameworkIds: Joi.array()
        .items(Joi.string().uuid())
        .min(1)
        .required()
        .messages({
            'array.base': 'Control frameworks must be provided as an array',
            'array.min': 'At least one control framework is required',
            'array.items.string.uuid': 'Each control framework ID must be a valid UUID',
            'any.required': 'Control frameworks are required'
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
        .required()
        .messages({
            'string.length': 'Secondary phone must be exactly 10 digits',
            'string.pattern.base': 'Secondary phone must contain only digits',
        }),

    primaryCountryCode: Joi.string()
        .min(1)
        .max(5)  // Correct usage for length range
        .required()
        .pattern(/^\+?\d+$/)
        .messages({
            'string.min': 'Country code must be between 1 and 5 characters',
            'string.max': 'Country code must be between 1 and 5 characters',
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),

    secondaryCountryCode: Joi.string()
        .min(1)
        .max(5)
        .required()
        .pattern(/^\+?\d+$/)
        .messages({
            'string.min': 'Country code must be between 1 and 5 characters',
            'string.max': 'Country code must be between 1 and 5 characters',
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),

})
    .custom((value, helpers) => {
        if (value.primaryEmail && value.secondaryEmail && value.primaryEmail === value.secondaryEmail) {
            return helpers.message('Primary email and secondary email must be different');
        }
        if (value.primaryPhone && value.secondaryPhone && value.primaryPhone === value.secondaryPhone) {
            return helpers.message('Primary phone and secondary phone must be different');
        }
        return value;
    }, 'Custom validation');

const createCompanySchema = baseCompanySchema;

const updateCompanySchema = Joi.object({
    companyName: Joi.string()
        .max(255)
        .optional()
        .messages({
            'string.empty': 'Company name cannot be empty',
            'string.max': 'Company name must be less than or equal to 255 characters',
        }),

    postalAddress: Joi.string()
        .max(255)
        .optional()
        .messages({
            'string.empty': 'Postal address cannot be empty',
            'string.max': 'Postal address must be less than or equal to 255 characters',
        }),

    gstNumber: Joi.string()
        .length(15)
        .pattern(/^\d+$/)
        .optional()
        .messages({
            'string.length': 'GST number must be exactly 15 digits',
            'string.pattern.base': 'GST number must contain only digits',
        }),

    panNumber: Joi.string()
        .length(10)
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .optional()
        .messages({
            'string.length': 'PAN number must be exactly 10 characters',
            'string.pattern.base': 'PAN number must match the pattern XXXXX1234X',
        }),

    industrySectorId: Joi.string()
        .uuid()
        .optional()
        .messages({
            'string.uuid': 'Industry sector ID must be a valid UUID',
        }),

    primaryEmail: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Primary email must be a valid email address',
        }),

    secondaryEmail: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Secondary email must be a valid email address',
        }),
    controlFrameworkIds: Joi.array()
        .items(Joi.string().uuid())
        .min(1)
        .required()
        .messages({
            'array.base': 'Control frameworks must be provided as an array',
            'array.min': 'At least one control framework is required',
            'array.items.string.uuid': 'Each control framework ID must be a valid UUID',
            'any.required': 'Control frameworks are required'
        }),

    primaryPhone: Joi.string()
        .length(10)
        .pattern(/^\d+$/)
        .optional()
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

    primaryCountryCode: Joi.string()
        .min(1)
        .max(5)
        .optional()
        .pattern(/^\+?\d+$/)
        .messages({
            'string.min': 'Country code must be between 1 and 5 characters',
            'string.max': 'Country code must be between 1 and 5 characters',
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),

    secondaryCountryCode: Joi.string()
        .min(1)
        .max(5)
        .optional()
        .pattern(/^\+?\d+$/)
        .messages({
            'string.min': 'Country code must be between 1 and 5 characters',
            'string.max': 'Country code must be between 1 and 5 characters',
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),
})
    .custom((value, helpers) => {
        if (value.primaryEmail && value.secondaryEmail && value.primaryEmail === value.secondaryEmail) {
            return helpers.message('Primary email and secondary email must be different');
        }
        if (value.primaryPhone && value.secondaryPhone && value.primaryPhone === value.secondaryPhone) {
            return helpers.message('Primary phone and secondary phone must be different');
        }
        return value;
    }, 'Custom validation');

export { createCompanySchema, updateCompanySchema };
