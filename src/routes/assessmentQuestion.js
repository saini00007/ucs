import express from 'express';
import { 
  addAssessmentQuestion, 
  getAssessmentQuestions,  
  deleteAssessmentQuestion,
  getAssessmentQuestionById
} from '../controllers/assessmentQuestion.js';
import { authorizeAssessmentQuestion } from '../middleware/authorize/authorizeAssessmentQuestion.js';

const router = express.Router();

import mockAuthenticate from '../middleware/mockAuth.js';
import { authenticate } from '../middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;
router.use(authMiddleware);

// Route to add a question to an assessment
router.post('/assessments/:assessmentId/questions',authorizeAssessmentQuestion(['1']), addAssessmentQuestion);

// Route to get a question by ID
router.get('/assessments/:assessmentId/questions/:assessmentQuestionId',authorizeAssessmentQuestion(['1','2','3']), getAssessmentQuestionById);

// Route to get all questions for a specific assessment
router.get('/assessments/:assessmentId/questions',authorizeAssessmentQuestion(['1','2','3']),getAssessmentQuestions);

// Route to delete an assessment question
router.delete('/assessments/:assessmentId/questions/:assessmentQuestionId',authorizeAssessmentQuestion(['1']), deleteAssessmentQuestion);

export default router;
