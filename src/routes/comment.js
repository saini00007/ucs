import express from 'express';
import {
  createComment,
  getCommentsByAnswerId,
  getCommentById,
  updateComment,
  deleteComment,
} from '../controllers/comment.js';

import { checkAccess } from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

// Route to create a new comment for a specific answer
router.post('/answers/:answerId/comments',
  attachResourceInfo('Comment', 'Answer', 'answerId', 'create'),
  checkAccess,
  createComment);

// Route to get all comments for a specific answer
router.get('/answers/:answerId/comments',
  attachResourceInfo('Comment', 'Answer', 'answerId', 'list'),
  checkAccess,
  getCommentsByAnswerId);

// Route to get a specific comment by ID
router.get('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'read'),
  checkAccess,
  getCommentById);

// Route to update a specific comment
router.put('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'update'),
  checkAccess,
  updateComment);

// Route to delete a specific comment
router.delete('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'remove'),
  checkAccess,
  deleteComment);

export default router;
