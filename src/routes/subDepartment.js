import express from 'express';
import validate from '../middleware/validate.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';
import { RESOURCE_TYPES, ACTION_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';
import { getSubAssessmentBySubDepartmentId, getSubDepartmentById, getSubdepartmentMetrics, getUsersBySubDepartmentId } from '../controllers/subDepartment.js';

const router = express.Router();

// Route to get users by department
router.get('/:subDepartmentId',
    attachResourceInfo(
        RESOURCE_TYPES.SUB_DEPARTMENT,
        CONTENT_RESOURCE_TYPES.SUB_DEPARTMENT,
        'subDepartmentId',
        ACTION_IDS.READ
    ),
    checkAccess,
    getSubDepartmentById
);


// Route to get users by department
router.get('/:subDepartmentId/users',
    attachResourceInfo(
        RESOURCE_TYPES.USER,
        CONTENT_RESOURCE_TYPES.SUB_DEPARTMENT,
        'subDepartmentId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getUsersBySubDepartmentId
);

// Route to get sub assessments by sub departmentId
router.get('/:subDepartmentId/sub-assessments',
    attachResourceInfo(
        RESOURCE_TYPES.SUB_ASSESSMENT,
        CONTENT_RESOURCE_TYPES.SUB_DEPARTMENT,
        'subDepartmentId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getSubAssessmentBySubDepartmentId
)

router.get('/:subDepartmentId/risk-metrics',getSubdepartmentMetrics)


export default router;