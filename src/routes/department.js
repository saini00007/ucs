import express from 'express';
import validate from '../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../joi/department.js';
import {
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getAssessmentByDepartmentId,
    getUsersByDepartmentId,

} from '../controllers/department.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';

const router = express.Router();

// Route to get a department by its ID
router.get('/:departmentId',
    attachResourceInfo('Department', 'Department', 'departmentId', 'read'),
    checkAccess,
    getDepartmentById
);

// Route to create a new department
router.post('/',
    attachResourceInfo('Department', 'Company', 'companyId', 'create'),
    checkAccess,
    validate(createDepartmentSchema),
    createDepartment
);

// Route to update a department by its ID
router.put('/:departmentId',
    attachResourceInfo('Department', 'Department', 'departmentId', 'update'),
    checkAccess,
    validate(updateDepartmentSchema),
    updateDepartment
);

// Route to delete a department by its ID
router.delete('/:departmentId',
    attachResourceInfo('Department', 'Department', 'departmentId', 'remove'),
    checkAccess,
    deleteDepartment
);

// Route to get all assessments for a department
router.get('/:departmentId/assessments',
    attachResourceInfo('Assessment', 'Department', 'departmentId', 'list'),
    checkAccess,
    getAssessmentByDepartmentId
);

// Route to get users by department
router.get('/:departmentId/users',
    attachResourceInfo('User', 'Department', 'departmentId', 'list'),
    checkAccess,
    getUsersByDepartmentId
);

export default router;
