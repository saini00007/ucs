import express from 'express';
import { 
  addAssessmentQuestion, 
  getAssessmentQuestions,  
  deleteAssessmentQuestion,
  getAssessmentQuestionById
} from '../controllers/assessmentQuestion.js';

const router = express.Router();

// Add a question to an assessment
router.post('/add', addAssessmentQuestion);

router.get('/:id', getAssessmentQuestionById);
router.get('/assessment/:assessmentId', getAssessmentQuestions);


router.delete('/delete/:id', deleteAssessmentQuestion);

export default router;
