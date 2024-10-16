import express from 'express';
import { uploadFiles } from '../middleware/fileUpload.js';
import {
  createAnswer,
  getAnswersByQuestion,
  deleteAnswer,
  serveFile
} from '../controllers/answer.js';

const router = express.Router();

// Route to create a new answer
router.post('/questions/:assessmentQuestionId/answers', uploadFiles, createAnswer);

// Route to get all answers for a specific assessment question
router.get('/questions/:assessmentQuestionId/answers', getAnswersByQuestion);

// Route to serve evidence files
router.get('/evidence-files/:fileId', serveFile);

// Route to delete an answer
router.delete('/answers/:answerId', deleteAnswer);

export default router;
