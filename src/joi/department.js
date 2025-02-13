import Joi from 'joi';

const baseDepartmentSchema = Joi.object({
  departmentName: Joi.string()
    .min(5)
    .required()
    .messages({
      'string.empty': 'Department name is required',
      'string.min': 'Department name must be at least 5 characters long',
    }),
  companyId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.guid': 'Company ID must be a valid UUID',
      'any.required': 'Company ID is required',
    }),
  masterDepartmentId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .optional()
    .messages({
      'string.guid': 'Master Department ID must be a valid UUID',
    }),
  deadline: Joi.date()
    .iso() // 2025-01-10T10:00:00Z
    .greater('now')
    .required()
    .messages({
      'date.base': 'Deadline must be a valid date.',
      'date.greater': 'Deadline must be in the future.',
      'any.required': 'Deadline is required.',
    }),
});


const createDepartmentSchema = baseDepartmentSchema;

const updateDepartmentSchema = Joi.object({
  departmentName: Joi.string()
    .min(5)
    .optional()
    .messages({
      'string.min': 'Department name must be at least 5 characters long',
    }),
  masterDepartmentId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .optional()
    .messages({
      'string.guid': 'Master Department ID must be a valid UUID',
    })
});

export { createDepartmentSchema, updateDepartmentSchema };
