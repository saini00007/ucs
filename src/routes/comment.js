import express from 'express';
import {
  createComment,
  getCommentsByAssessmentQuestionId,
  getCommentById,
  updateComment,
  deleteComment,
} from '../controllers/comment.js';
import commentSchema from '../joi/comment.js';
import validate from '../middleware/validate.js';
import checkAccess  from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

router.post('/questions/:assessmentQuestionId/comments',
  validate(commentSchema),
  attachResourceInfo('Comment', 'AssessmentQuestion', 'assessmentQuestionId', 'create'),
  checkAccess,
  createComment);

router.get('/questions/:assessmentQuestionId/comments',
  attachResourceInfo('Comment', 'AssessmentQuestion', 'assessmentQuestionId', 'list'),
  checkAccess,
  getCommentsByAssessmentQuestionId);

router.get('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'read'),
  checkAccess,
  getCommentById);

router.put('/comments/:commentId',
  validate(commentSchema),
  attachResourceInfo('Comment', 'Comment', 'commentId', 'update'),
  checkAccess,
  updateComment);

router.delete('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'remove'),
  checkAccess,
  deleteComment);

export default router;
