// joi/departmentValidation.js
import Joi from 'joi';

const departmentSchema = Joi.object({
  departmentName: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Department name is required',
      'any.required': 'Department name is required',
    }),
  companyId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.empty': 'Company ID is required',
      'string.guid': 'Company ID must be a valid UUID',
      'any.required': 'Company ID is required',
    }),
  masterDepartmentId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .optional()
    .messages({
      'string.guid': 'Master Department ID must be a valid UUID',
    })
});

export default departmentSchema;
