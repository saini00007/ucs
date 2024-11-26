import express from 'express';
import { uploadFiles } from '../middleware/fileUpload.js';
import {
  createAnswer,
  updateAnswer,
  getAnswerByQuestion,
  serveFile
} from '../controllers/answer.js';
import validate from '../middleware/validate.js';
import { createAnswerSchema, updateAnswerSchema } from '../joi/answer.js';
import checkAccess from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

// Route to create a new answer
router.post('/questions/:assessmentQuestionId/answers',
  attachResourceInfo('Answer', 'AssessmentQuestion', 'assessmentQuestionId', 'create'),
  checkAccess,
  uploadFiles,
  validate(createAnswerSchema),
  createAnswer);

// Route to update an existing answer
router.put('/answers/:answerId',
  attachResourceInfo('Answer', 'Answer', 'answerId', 'update'),
  checkAccess,
  uploadFiles,
  validate(updateAnswerSchema),
  updateAnswer);

router.get('/questions/:assessmentQuestionId/answers',
  attachResourceInfo('Answer', 'AssessmentQuestion', 'assessmentQuestionId', 'read'),
  checkAccess,
  getAnswerByQuestion);

router.get('/evidence-files/:fileId',
  attachResourceInfo('EvidenceFile', 'EvidenceFile', 'fileId', 'read'),
  checkAccess,
  serveFile);

export default router;
