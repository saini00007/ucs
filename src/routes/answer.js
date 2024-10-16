import express from 'express';
import { uploadFiles } from '../middleware/fileUpload.js';
import {
  createAnswer,
  getAnswersByQuestion,
  deleteAnswer,
  serveFile
} from '../controllers/answer.js';
import { authorizeAnswer } from '../middleware/authorize/authorizeAnswer.js';

const router = express.Router();

import mockAuthenticate from '../middleware/mockAuth.js';
import { authenticate } from '../middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;
router.use(authMiddleware);

// Route to create a new answer
router.post('/assessments/:assessmentId/questions/:assessmentQuestionId/answers', authorizeAnswer(['1', '2', '3']), uploadFiles, createAnswer);

// Route to get all answers for a specific assessment question
router.get('/assessments/:assessmentId/questions/:assessmentQuestionId/answers', authorizeAnswer(['1', '2', '3']), getAnswersByQuestion);

// Route to serve evidence files
router.get('/assessments/:assessmentId/answers/:answerId/evidence-files/:fileId', authorizeAnswer(['1', '2']), serveFile);

// Route to delete an answer
router.delete('/answers/:answerId', authorizeAnswer(['1', '2', '3']), deleteAnswer);

export default router;
