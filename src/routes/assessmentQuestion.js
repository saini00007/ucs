import express from 'express';
import { 
  getAssessmentQuestions,  
  getAssessmentQuestionById
} from '../controllers/assessmentQuestion.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess  from '../middleware/authorize.js';

const router = express.Router();

router.get('/questions/:assessmentQuestionId', 
    attachResourceInfo('AssessmentQuestion', 'AssessmentQuestion', 'assessmentQuestionId', 'read'), 
    checkAccess, 
    getAssessmentQuestionById
);

// Route to get all questions for a specific assessment
router.get('/assessments/:assessmentId/questions', 
    attachResourceInfo('AssessmentQuestion', 'Assessment', 'assessmentId', 'list'), 
    checkAccess, 
    getAssessmentQuestions
);

export default router;
