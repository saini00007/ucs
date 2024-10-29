import express from 'express';
import {
  createComment,
  getCommentsByQuestionId,
  getCommentById,
  updateComment,
  deleteComment,
} from '../controllers/comment.js';

const router = express.Router();

// Route to create a new comment for a specific assessment question
router.post('/questions/:assessmentQuestionId/comments', createComment);

// Route to get all comments for a specific assessment question
router.get('/questions/:assessmentQuestionId/comments', getCommentsByQuestionId);

// Route to get a specific comment by ID
router.get('/comments/:id', getCommentById);

// Route to update a specific comment
router.put('/comments/:commentId', updateComment);

// Route to delete a specific comment
router.delete('/comments/:commentId', deleteComment);


export default router;
