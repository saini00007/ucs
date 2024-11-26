import express from 'express';
import {
  createComment,
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
  attachResourceInfo('Comment', 'AssessmentQuestion', 'assessmentQuestionId', 'create'),
  checkAccess,
  validate(commentSchema),
  createComment);

router.get('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'read'),
  checkAccess,
  getCommentById);

router.put('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'update'),
  checkAccess,
  validate(commentSchema),
  updateComment);

router.delete('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'remove'),
  checkAccess,
  deleteComment);

export default router;
