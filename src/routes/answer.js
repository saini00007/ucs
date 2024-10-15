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
router.post('/assessments/:assessmentId/questions/:assessmentQuestionId/answers', uploadFiles, createAnswer);

// Route to get all answers for a specific assessment question
router.get('/assessments/:assessmentId/questions/:assessment_question_id/answers', getAnswersByQuestion);

// Route to serve a specific uploaded file
router.get('/evidence-files/:file_id', serveFile);

// Route to delete a specific answer
router.delete('/answers/:answer_id', deleteAnswer);

export default router;
