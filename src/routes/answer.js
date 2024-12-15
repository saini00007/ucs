import express from 'express';

import {
  createAnswer,
  updateAnswer,
  serveFile
} from '../controllers/answer.js';
import validate from '../middleware/validate.js';
import { createAnswerSchema, updateAnswerSchema } from '../joi/answer.js';
import checkAccess from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

import uploadMiddleware from '../middleware/fileUpload.js';
const uploadFiles = uploadMiddleware.evidenceFiles(100, 10);

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

// Route to serve file
router.get('/evidence-files/:fileId',
  attachResourceInfo('EvidenceFile', 'EvidenceFile', 'fileId', 'read'),
  checkAccess,
  serveFile);

export default router;
