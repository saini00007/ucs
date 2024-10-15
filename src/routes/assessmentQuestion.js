import express from 'express';
import { 
  addAssessmentQuestion, 
  getAssessmentQuestions,  
  deleteAssessmentQuestion,
  getAssessmentQuestionById
} from '../controllers/assessmentQuestion.js';

const router = express.Router();

// Route to add a question to an assessment
router.post('/assessments/:assessmentId/questions', addAssessmentQuestion);

// Route to get a question by ID
router.get('/assessments/:assessmentId/questions/:id', getAssessmentQuestionById);

// Route to get all questions for a specific assessment
router.get('/assessments/:assessmentId/questions', getAssessmentQuestions);

// Route to delete an assessment question
router.delete('/questions/:id', deleteAssessmentQuestion);

export default router;