import express from 'express';
import {
    startAssessment,
    getAssessmentById,
    submitAssessment,
    reopenAssessment,
    getAssessmentQuestionsByAssessmentId,
    getSubAssessmentByAssessmentId,
} from '../controllers/assessment.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';
import { RESOURCE_TYPES, ACTION_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';

const router = express.Router();

// Route to mark an assessment as started
router.put('/:assessmentId/start',
    attachResourceInfo(
        RESOURCE_TYPES.ASSESSMENT,
        CONTENT_RESOURCE_TYPES.ASSESSMENT,
        'assessmentId',
        ACTION_IDS.START
    ),
    checkAccess,
    startAssessment
);

// Route to submit an assessment
router.put('/:assessmentId/submit',
    attachResourceInfo(
        RESOURCE_TYPES.ASSESSMENT,
        CONTENT_RESOURCE_TYPES.ASSESSMENT,
        'assessmentId',
        ACTION_IDS.SUBMIT
    ),
    checkAccess,
    submitAssessment
);

//Route to reopen an assessment
router.put('/:assessmentId/reopen',
    attachResourceInfo(
        RESOURCE_TYPES.ASSESSMENT,
        CONTENT_RESOURCE_TYPES.ASSESSMENT,
        'assessmentId',
        ACTION_IDS.REOPEN
    ),
    checkAccess,
    reopenAssessment
);

// Route to get an assessment by its ID
router.get('/:assessmentId',
    attachResourceInfo(
        RESOURCE_TYPES.ASSESSMENT,
        CONTENT_RESOURCE_TYPES.ASSESSMENT,
        'assessmentId',
        ACTION_IDS.READ
    ),
    checkAccess,
    getAssessmentById
);

// Route to get all questions for a specific assessment
router.get('/:assessmentId/questions',
    attachResourceInfo(
        RESOURCE_TYPES.ASSESSMENT_QUESTION,
        CONTENT_RESOURCE_TYPES.ASSESSMENT,
        'assessmentId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getAssessmentQuestionsByAssessmentId
);

// Route to get sub assessments for a specific assessment
router.get('/:assessmentId/sub-assessments',
    attachResourceInfo(
        RESOURCE_TYPES.SUB_ASSESSMENT,
        CONTENT_RESOURCE_TYPES.ASSESSMENT,
        'assessmentId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getSubAssessmentByAssessmentId
);



export default router;