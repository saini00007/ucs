import express from 'express';
import { 
  addAssessmentQuestions, 
  getAssessmentQuestions,  
  deleteAssessmentQuestions,
  getAssessmentQuestionById
} from '../controllers/assessmentQuestion.js';

const router = express.Router();


// Route to add a question to an assessment
router.post('/assessments/:assessmentId/questions', addAssessmentQuestions);

// Route to get a question by ID
router.get('/questions/:assessmentQuestionId', getAssessmentQuestionById);

// Route to get all questions for a specific assessment
router.get('/assessments/:assessmentId/questions', getAssessmentQuestions);

// Route to delete an assessment question
router.delete('/questions', deleteAssessmentQuestions);

export default router;
