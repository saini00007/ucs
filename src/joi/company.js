import Joi from 'joi';

const baseCompanySchema = Joi.object({
    companyLegalName: Joi.string()
        .min(1)
        .max(255)
        .required()
        .messages({
            'string.empty': 'Company legal name cannot be empty',
            'string.max': 'Company legal name must be less than or equal to 255 characters',
            'any.required': 'Company legal name is required',
        }),

    tradeName: Joi.string()
        .max(255)
        .optional(),

    website: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': 'Website must be a valid URL',
        }),

    incorporationDate: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.base': 'Incorporation date must be a valid date',
        }),

    companySize: Joi.string()
        .optional(),

    streetAddress: Joi.string()
        .max(255)
        .optional(),

    city: Joi.string()
        .max(100)
        .optional(),

    state: Joi.string()
        .max(100)
        .optional(),

    country: Joi.string()
        .max(100)
        .optional(),

    postalCode: Joi.string()
        .max(20)
        .optional(),

    taxIdType: Joi.string()
        .max(50)
        .optional(),

    taxIdNumber: Joi.string()
        .max(50)
        .optional(),

    companyRegistrationNumber: Joi.string()
        .max(50)
        .optional(),

    panReferenceNumber: Joi.string()
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .optional()
        .messages({
            'string.pattern.base': 'PAN number must match the pattern XXXXX1234X',
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
        .required()
        .messages({
            'string.email': 'Secondary email must be a valid email address',
            'any.required': 'Secondary email is required',
        }),

    primaryPhone: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Primary phone must contain only digits',
        }),

    secondaryPhone: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Secondary phone must contain only digits',
        }),

    primaryCountryCode: Joi.string()
        .min(1)
        .max(5)
        .pattern(/^\+?\d+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),

    secondaryCountryCode: Joi.string()
        .min(1)
        .max(5)
        .pattern(/^\+?\d+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Country code must contain only digits and optionally a "+" at the beginning',
        }),

    auditCompletionDeadline: Joi.date()
        .iso()
        .greater('now')
        .optional()
        .messages({
            'date.base': 'Audit completion deadline must be a valid date',
            'date.greater': 'Audit completion deadline must be in the future',
        }),

    annualRevenueRange: Joi.string()
        .optional(),

    industrySectorId: Joi.string()
        .uuid()
        .optional()
        .messages({
            'string.uuid': 'Industry sector ID must be a valid UUID',
        }),
    controlFrameworkIds: Joi.array()
        .items(Joi.string().uuid())
        .optional()
        .messages({
            'string.uuid': 'Each control framework ID must be a valid UUID',
            'array.base': 'Control framework IDs must be an array',
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
    });

// For create - require specific fields
const createCompanySchema = baseCompanySchema.fork(
    ['companyLegalName', 'primaryEmail', 'secondaryEmail'],
    (field) => field.required()
);

// For update - make all fields optional while preserving their validation rules
const updateCompanySchema = Joi.object({
    companyLegalName: baseCompanySchema.extract('companyLegalName').optional(),
    tradeName: baseCompanySchema.extract('tradeName').optional(),
    website: baseCompanySchema.extract('website').optional(),
    incorporationDate: baseCompanySchema.extract('incorporationDate').optional(),
    companySize: baseCompanySchema.extract('companySize').optional(),
    streetAddress: baseCompanySchema.extract('streetAddress').optional(),
    city: baseCompanySchema.extract('city').optional(),
    state: baseCompanySchema.extract('state').optional(),
    country: baseCompanySchema.extract('country').optional(),
    postalCode: baseCompanySchema.extract('postalCode').optional(),
    taxIdType: baseCompanySchema.extract('taxIdType').optional(),
    taxIdNumber: baseCompanySchema.extract('taxIdNumber').optional(),
    companyRegistrationNumber: baseCompanySchema.extract('companyRegistrationNumber').optional(),
    panReferenceNumber: baseCompanySchema.extract('panReferenceNumber').optional(),
    primaryEmail: baseCompanySchema.extract('primaryEmail').optional(),
    secondaryEmail: baseCompanySchema.extract('secondaryEmail').optional(),
    primaryPhone: baseCompanySchema.extract('primaryPhone').optional(),
    secondaryPhone: baseCompanySchema.extract('secondaryPhone').optional(),
    primaryCountryCode: baseCompanySchema.extract('primaryCountryCode').optional(),
    secondaryCountryCode: baseCompanySchema.extract('secondaryCountryCode').optional(),
    auditCompletionDeadline: baseCompanySchema.extract('auditCompletionDeadline').optional(),
    annualRevenueRange: baseCompanySchema.extract('annualRevenueRange').optional(),
    industrySectorId: baseCompanySchema.extract('industrySectorId').optional(),
    controlFrameworkIds:baseCompanySchema.extract('controlFrameworkIds').optional()
})
    .custom((value, helpers) => {
        // Maintain the same custom validations for update
        if (value.primaryEmail && value.secondaryEmail && value.primaryEmail === value.secondaryEmail) {
            return helpers.message('Primary email and secondary email must be different');
        }
        if (value.primaryPhone && value.secondaryPhone && value.primaryPhone === value.secondaryPhone) {
            return helpers.message('Primary phone and secondary phone must be different');
        }
        return value;
    });

export { createCompanySchema, updateCompanySchema };