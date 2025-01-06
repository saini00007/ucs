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
import { RESOURCE_TYPES, ACTION_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';

import uploadMiddleware from '../middleware/fileUpload.js';
const uploadFiles = uploadMiddleware.evidenceFiles(100, 10);

const router = express.Router();

// Route to create a new answer
router.post('/questions/:assessmentQuestionId/answers',
  attachResourceInfo(
    RESOURCE_TYPES.ANSWER,
    CONTENT_RESOURCE_TYPES.ASSESSMENT_QUESTION,
    'assessmentQuestionId',
    ACTION_IDS.CREATE
  ),
  checkAccess,
  uploadFiles,
  validate(createAnswerSchema),
  createAnswer
);

// Route to update an existing answer
router.put('/answers/:answerId',
  attachResourceInfo(
    RESOURCE_TYPES.ANSWER,
    CONTENT_RESOURCE_TYPES.ANSWER,
    'answerId',
    ACTION_IDS.UPDATE
  ),
  checkAccess,
  uploadFiles,
  validate(updateAnswerSchema),
  updateAnswer
);

// Route to serve file
router.get('/evidence-files/:fileId',
  attachResourceInfo(
    RESOURCE_TYPES.EVIDENCE_FILE,
    CONTENT_RESOURCE_TYPES.EVIDENCE_FILE,
    'fileId',
    ACTION_IDS.READ
  ),
  checkAccess,
  serveFile
);

export default router;