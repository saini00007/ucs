//have to remove this route
import express from 'express';
import { getMasterQuestions } from '../controllers/masterQuestion.js';

const router = express.Router();
import checkAccess from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

router.get('/master-questions', attachResourceInfo('MasterQuestion', 'MasterQuestion', null , 'list'), checkAccess, getMasterQuestions);

export default router;
