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
import { RESOURCE_TYPES, ACTION_IDS ,CONTENT_RESOURCE_TYPES} from '../utils/constants.js';

const router = express.Router();

// Route to get a department by its ID
router.get('/:departmentId',
    attachResourceInfo(
        RESOURCE_TYPES.DEPARTMENT,
        CONTENT_RESOURCE_TYPES.DEPARTMENT,
        'departmentId',
        ACTION_IDS.READ
    ),
    checkAccess,
    getDepartmentById
);

// Route to create a new department
router.post('/',
    attachResourceInfo(
        RESOURCE_TYPES.DEPARTMENT,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.CREATE
    ),
    checkAccess,
    validate(createDepartmentSchema),
    createDepartment
);

// Route to update a department by its ID
router.put('/:departmentId',
    attachResourceInfo(
        RESOURCE_TYPES.DEPARTMENT,
        CONTENT_RESOURCE_TYPES.DEPARTMENT,
        'departmentId',
        ACTION_IDS.UPDATE
    ),
    checkAccess,
    validate(updateDepartmentSchema),
    updateDepartment
);

// Route to delete a department by its ID
router.delete('/:departmentId',
    attachResourceInfo(
        RESOURCE_TYPES.DEPARTMENT,
        CONTENT_RESOURCE_TYPES.DEPARTMENT,
        'departmentId',
        ACTION_IDS.REMOVE
    ),
    checkAccess,
    deleteDepartment
);

// Route to get all assessments for a department
router.get('/:departmentId/assessments',
    attachResourceInfo(
        RESOURCE_TYPES.ASSESSMENT,
        CONTENT_RESOURCE_TYPES.DEPARTMENT,
        'departmentId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getAssessmentByDepartmentId
);

// Route to get users by department
router.get('/:departmentId/users',
    attachResourceInfo(
        RESOURCE_TYPES.USER,
        CONTENT_RESOURCE_TYPES.DEPARTMENT,
        'departmentId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getUsersByDepartmentId
);

export default router;