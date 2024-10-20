

import express from 'express';
import { getMasterQuestions } from '../controllers/masterQuestion.js';

const router = express.Router();

router.get('/master-questions', getMasterQuestions);

export default router;
