import express from 'express';
import {
    markAssessmentAsStarted,
    getAssessmentById,
    getAssessmentByDepartmentId,
    submitAssessment,
    reopenAssessment
} from '../controllers/assessment.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';

const router = express.Router();

// Route to mark an assessment as started
router.put('/assessments/:assessmentId/start',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'start'),
    checkAccess,
    markAssessmentAsStarted
);

// Route to submit an assessment
router.put('/assessments/:assessmentId/submit',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'submit'),
    checkAccess,
    submitAssessment
);

router.put('/assessments/:assessmentId/reopen',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'reopen'),
    checkAccess,
    reopenAssessment);


// Route to get an assessment by its ID
router.get('/assessments/:assessmentId',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'read'),
    checkAccess,
    getAssessmentById
);

// Route to get all assessments for a department
router.get('/departments/:departmentId/assessments',
    attachResourceInfo('Assessment', 'Department', 'departmentId', 'read'),
    checkAccess,
    getAssessmentByDepartmentId
);

export default router;
