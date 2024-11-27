import express from 'express';
import {
    startAssessment,
    getAssessmentById,
    submitAssessment,
    reopenAssessment,
    getAssessmentQuestionsByAssessmentId,
} from '../controllers/assessment.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';

const router = express.Router();

// Route to mark an assessment as started
router.put('/:assessmentId/start',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'start'),
    checkAccess,
    startAssessment
);

// Route to submit an assessment
router.put('/:assessmentId/submit',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'submit'),
    checkAccess,
    submitAssessment
);

//Route to reopen an assessment
router.put('/:assessmentId/reopen',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'reopen'),
    checkAccess,
    reopenAssessment);

// Route to get an assessment by its ID
router.get('/:assessmentId',
    attachResourceInfo('Assessment', 'Assessment', 'assessmentId', 'read'),
    checkAccess,
    getAssessmentById
);

// Route to get all questions for a specific assessment
router.get('/:assessmentId/questions',
    attachResourceInfo('AssessmentQuestion', 'Assessment', 'assessmentId', 'list'),
    checkAccess,
    getAssessmentQuestionsByAssessmentId
);

export default router;
