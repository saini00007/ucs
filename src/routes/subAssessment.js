import express from 'express';
import validate from '../middleware/validate.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';
import { RESOURCE_TYPES, ACTION_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';
import { getAssessmentQuestionsBySubAssessmentId, getSubAssessmentById, reopenSubAssessment, submitSubAssessment } from '../controllers/subAssessments.js';

const router = express.Router();


// Route to get sub assessment
router.get('/:subAssessmentId',
    attachResourceInfo(
        RESOURCE_TYPES.SUB_ASSESSMENT,
        CONTENT_RESOURCE_TYPES.SUB_ASSESSMENT,
        'subAssessmentId',
        ACTION_IDS.READ
    ),
    checkAccess,
    getSubAssessmentById
);

router.get('/:subAssessmentId/questions',
    attachResourceInfo(
        RESOURCE_TYPES.SUB_ASSESSMENT_QUESTION,
        CONTENT_RESOURCE_TYPES.SUB_ASSESSMENT,
        'subAssessmentId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getAssessmentQuestionsBySubAssessmentId
);

// Route to submit an subassessment
router.put('/:subAssessmentId/submit',
    // attachResourceInfo(
    //     RESOURCE_TYPES.SUB_ASSESSMENT,
    //     CONTENT_RESOURCE_TYPES.SUB_ASSESSMENT,
    //     'subAssessmentId',
    //     ACTION_IDS.SUBMIT
    // ),
    // checkAccess,
    submitSubAssessment
);

//Route to reopen an subassessment
router.put('/:subAssessmentId/reopen',
    // attachResourceInfo(
    //     RESOURCE_TYPES.SUB_ASSESSMENT,
    //     CONTENT_RESOURCE_TYPES.SUB_ASSESSMENT,
    //     'subAssessmentId',
    //     ACTION_IDS.REOPEN
    // ),
    // checkAccess,
    reopenSubAssessment
);





export default router;