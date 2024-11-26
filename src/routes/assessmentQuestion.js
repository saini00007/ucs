import express from 'express';
import {
  getAssessmentQuestionById,
  getAnswerByAssessmentQuestionId,
  getCommentsByAssessmentQuestionId,
} from '../controllers/assessmentQuestion.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';

const router = express.Router();

router.get('/:assessmentQuestionId',
  attachResourceInfo('AssessmentQuestion', 'AssessmentQuestion', 'assessmentQuestionId', 'read'),
  checkAccess,
  getAssessmentQuestionById
);

router.get('/:assessmentQuestionId/answers',
  attachResourceInfo('Answer', 'AssessmentQuestion', 'assessmentQuestionId', 'read'),
  checkAccess,
  getAnswerByAssessmentQuestionId);

router.get('/:assessmentQuestionId/comments',
  attachResourceInfo('Comment', 'AssessmentQuestion', 'assessmentQuestionId', 'list'),
  checkAccess,
  getCommentsByAssessmentQuestionId);

export default router;
