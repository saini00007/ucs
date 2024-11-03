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
import { createAnswerSchema } from '../joi/answer.js';
import { checkAccess } from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

// Route to create a new answer
router.post('/questions/:assessmentQuestionId/answers',
  uploadFiles,
  validate(createAnswerSchema),
  attachResourceInfo('Answer', 'AssessmentQuestion', 'assessmentQuestionId', 'create'),
  checkAccess,
  createAnswer);

// Route to update an existing answer
router.put('/answers/:answerId',
  uploadFiles,
  attachResourceInfo('Answer', 'Answer', 'answerId', 'update'),
  checkAccess,
  updateAnswer);

router.get('/questions/:assessmentQuestionId/answers',
  attachResourceInfo('Answer', 'AssessmentQuestion', 'assessmentQuestionId', 'read'),
  checkAccess,
  getAnswerByQuestion);

// Route to serve evidence files
router.get('/evidence-files/:fileId',
  attachResourceInfo('EvidenceFile', 'EvidenceFile', 'fileId', 'read'),
  checkAccess,
  serveFile);

// Route to delete an answer
router.delete('/answers/:answerId',
  attachResourceInfo('Answer', 'Answer', 'answerId', 'remove'),
  checkAccess,
  deleteAnswer);

export default router;
