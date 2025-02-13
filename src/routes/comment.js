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
import { RESOURCE_TYPES, ACTION_IDS,CONTENT_RESOURCE_TYPES } from '../utils/constants.js';

const router = express.Router();

// Route to create a new comment
router.post('/questions/:assessmentQuestionId/comments',
  attachResourceInfo(
    RESOURCE_TYPES.COMMENT,
    CONTENT_RESOURCE_TYPES.ASSESSMENT_QUESTION,
    'assessmentQuestionId',
    ACTION_IDS.CREATE
  ),
  checkAccess,
  validate(commentSchema),
  createComment
);

// Route to get a comment by its ID
router.get('/comments/:commentId',
  attachResourceInfo(
    RESOURCE_TYPES.COMMENT,
    CONTENT_RESOURCE_TYPES.COMMENT,
    'commentId',
    ACTION_IDS.READ
  ),
  checkAccess,
  getCommentById
);

// Route to update an existing comment
router.put('/comments/:commentId',
  // attachResourceInfo(
  //   RESOURCE_TYPES.COMMENT,
  //   CONTENT_RESOURCE_TYPES.COMMENT,
  //   'commentId',
  //   ACTION_IDS.UPDATE
  // ),
  // checkAccess,
  // validate(commentSchema),
  updateComment
);

// Route to delete a comment by its ID
router.delete('/comments/:commentId',
  // attachResourceInfo(
  //   RESOURCE_TYPES.COMMENT,
  //   CONTENT_RESOURCE_TYPES.COMMENT,
  //   'commentId',
  //   ACTION_IDS.REMOVE
  // ),
  // checkAccess,
  deleteComment
);

export default router;