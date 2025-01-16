import express from 'express';
import {
  getAssessmentQuestionById,
  getAnswerByAssessmentQuestionId,
  getCommentsByAssessmentQuestionId,
} from '../controllers/assessmentQuestion.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';
import { RESOURCE_TYPES, ACTION_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';

const router = express.Router();

// Route to get a specific assessment question by its ID
router.get('/:assessmentQuestionId',
  attachResourceInfo(
    RESOURCE_TYPES.ASSESSMENT_QUESTION,
    CONTENT_RESOURCE_TYPES.ASSESSMENT_QUESTION,
    'assessmentQuestionId',
    ACTION_IDS.READ
  ),
  checkAccess,
  getAssessmentQuestionById
);

// Route to get answers for a specific assessment question by its ID
router.get('/:assessmentQuestionId/answers',
  attachResourceInfo(
    RESOURCE_TYPES.ANSWER,
    CONTENT_RESOURCE_TYPES.ASSESSMENT_QUESTION,
    'assessmentQuestionId',
    ACTION_IDS.READ
  ),
  checkAccess,
  getAnswerByAssessmentQuestionId
);

// Route to get comments for a specific assessment question by its ID
router.get('/:assessmentQuestionId/comments',

  attachResourceInfo(
    RESOURCE_TYPES.COMMENT,
    CONTENT_RESOURCE_TYPES.ASSESSMENT_QUESTION,
    'assessmentQuestionId',
    ACTION_IDS.LIST
  ),
  checkAccess,
  getCommentsByAssessmentQuestionId
);



export default router;