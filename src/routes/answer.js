import express from 'express';
import { uploadFiles } from '../middleware/fileUpload.js';
import {
  createAnswer,
  updateAnswer,
  getAnswerByQuestion,
  deleteAnswer,
  serveFile
} from '../controllers/answer.js';
import validate from '../middleware/validate.js';
import { createAnswerSchema} from '../joi/answer.js';

const router = express.Router();

// Route to create a new answer
router.post('/questions/:assessmentQuestionId/answers', uploadFiles, validate(createAnswerSchema), createAnswer);

// Route to update an existing answer
router.put('/answers/:answerId',uploadFiles, updateAnswer);

// Route to get all answers for a specific assessment question
router.get('/questions/:assessmentQuestionId/answers', getAnswerByQuestion);

// Route to serve evidence files
router.get('/evidence-files/:fileId', serveFile);

// Route to delete an answer
router.delete('/answers/:answerId', deleteAnswer);

export default router;
