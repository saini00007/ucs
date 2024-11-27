import express from 'express';
import {
  getAssessmentQuestionById,
  getAnswerByAssessmentQuestionId,
  getCommentsByAssessmentQuestionId,
} from '../controllers/assessmentQuestion.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';

const router = express.Router();

// Route to get a specific assessment question by its ID
router.get('/:assessmentQuestionId',
  attachResourceInfo('AssessmentQuestion', 'AssessmentQuestion', 'assessmentQuestionId', 'read'),
  checkAccess,
  getAssessmentQuestionById
);

// Route to get answers for a specific assessment question by its ID
router.get('/:assessmentQuestionId/answers',
  attachResourceInfo('Answer', 'AssessmentQuestion', 'assessmentQuestionId', 'read'),
  checkAccess,
  getAnswerByAssessmentQuestionId
);

// Route to get comments for a specific assessment question by its ID
router.get('/:assessmentQuestionId/comments',
  attachResourceInfo('Comment', 'AssessmentQuestion', 'assessmentQuestionId', 'list'),
  checkAccess,
  getCommentsByAssessmentQuestionId
);

export default router;
