import express from 'express';
import { uploadFiles } from '../middleware/fileUpload.js'
import { createAnswer, getAnswersByQuestion, deleteAnswer, serveFile } from '../controllers/answer.js';


const router = express.Router();

// Route to create a new answer
router.post('/',uploadFiles, createAnswer);

// Route to get all answers for a specific assessment question
router.get('/:assessment_question_id', getAnswersByQuestion);

router.get('/file/:file_id',serveFile);

// Route to delete an answer
router.delete('/:answer_id', deleteAnswer);

export default router;
