import Joi from 'joi';

const companySchema = Joi.object({
  companyName: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Company name is required',
      'any.required': 'Company name is required',
      'string.max': 'Company name must be less than or equal to 255 characters',
    }),

  postalAddress: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Postal address is required',
      'any.required': 'Postal address is required',
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

  primaryEmail: Joi.string()
    .email()
    .required()
    .messages({
        'string.empty': 'Primary email is required',
        'any.required': 'Primary email is required',
        'string.email': 'Primary email must be a valid email address',
    }),

  secondaryEmail: Joi.string()
    .email()
    .required()
    .messages({
        'string.empty': 'Secondary email is required',
        'any.required': 'Secondary email is required',
        'string.email': 'Secondary email must be a valid email address',
    }),

  primaryPhone: Joi.string()
    .length(10)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.empty': 'Primary phone is required',
      'any.required': 'Primary phone is required',
      'string.length': 'Primary phone must be exactly 10 digits',
      'string.pattern.base': 'Primary phone must contain only digits',
    }),

  secondaryPhone: Joi.string()
    .length(10)
    .pattern(/^\d+$/)
    .optional()
    .messages({
        'string.empty': 'Secondary phone is required',
        'any.required': 'Secondary phone phone is required',
        'string.length': 'Secondary phone phone must be exactly 10 digits',
        'string.pattern.base': 'Secondary phone phone must contain only digits',
    })
});

export default companySchema;
