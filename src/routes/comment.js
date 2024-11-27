import express from 'express';
import {
  createComment,
  getCommentById,
  updateComment,
  deleteComment,
} from '../controllers/comment.js';
import commentSchema from '../joi/comment.js';
import validate from '../middleware/validate.js';
import checkAccess from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

// Route to create a new comment
router.post('/questions/:assessmentQuestionId/comments',
  attachResourceInfo('Comment', 'AssessmentQuestion', 'assessmentQuestionId', 'create'),
  checkAccess,
  validate(commentSchema),
  createComment
);

// Route to get a comment by its ID
router.get('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'read'),
  checkAccess,
  getCommentById
);

// Route to update an existing comment
router.put('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'update'),
  checkAccess,
  validate(commentSchema),
  updateComment
);

// Route to delete a comment by its ID
router.delete('/comments/:commentId',
  attachResourceInfo('Comment', 'Comment', 'commentId', 'remove'),
  checkAccess,
  deleteComment
);

export default router;
