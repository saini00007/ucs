import express from 'express';
import validate from '../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../joi/department.js';
import {
  getAllDepartmentsForCompany,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/department.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import  checkAccess  from '../middleware/authorize.js';

const router = express.Router();

// Route to get all departments for a company
router.get('/companies/:companyId/departments', 
    attachResourceInfo('Department', 'Company', 'companyId', 'list'), 
    checkAccess, 
    getAllDepartmentsForCompany
);

// Route to get a department by its ID
router.get('/departments/:departmentId', 
    attachResourceInfo('Department', 'Department', 'departmentId', 'read'), 
    checkAccess, 
    getDepartmentById
);

// Route to create a new department
router.post('/departments', 
    attachResourceInfo('Department', 'Company', 'companyId', 'create'), 
    checkAccess,
    validate(createDepartmentSchema), 
    createDepartment
);

// Route to update a department by its ID
router.put('/departments/:departmentId', 
    attachResourceInfo('Department', 'Department', 'departmentId', 'update'), 
    checkAccess, 
    validate(updateDepartmentSchema), 
    updateDepartment
);

// Route to delete a department by its ID
router.delete('/departments/:departmentId', 
    attachResourceInfo('Department', 'Department', 'departmentId', 'remove'), 
    checkAccess, 
    deleteDepartment
);

export default router;
