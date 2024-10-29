import Joi from 'joi';

const createDepartmentSchema = Joi.object({
  departmentName: Joi.string()
    .min(1)
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
});

const updateDepartmentSchema = Joi.object({
  departmentName: Joi.string()
    .min(1)
    .optional()
    .messages({
      'string.min': 'Department name must be at least 5 characters long',
    }),
  companyId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .optional()
    .messages({
      'string.guid': 'Company ID must be a valid UUID',
    }),
  masterDepartmentId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .optional()
    .messages({
      'string.guid': 'Master Department ID must be a valid UUID',
    }),
});

export { createDepartmentSchema, updateDepartmentSchema };
