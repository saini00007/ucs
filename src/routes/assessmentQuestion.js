import express from 'express';
import { 
  addAssessmentQuestions, 
  getAssessmentQuestions,  
  deleteAssessmentQuestions,
  getAssessmentQuestionById
} from '../controllers/assessmentQuestion.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess  from '../middleware/authorize.js';

const router = express.Router();

// Route to add a question to an assessment
// router.post('/assessments/:assessmentId/questions', 
//     attachResourceInfo('AssessmentQuestion', 'Assessment', 'assessmentId', 'create'), 
//     checkAccess, 
//     addAssessmentQuestions
// );

// Route to get a question by ID
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

// Route to delete an assessment question
// router.delete('/assessments/:assessmentId/questions/', 
//     attachResourceInfo('AssessmentQuestion', 'Assessment', 'assessmentId', 'remove'), 
//     checkAccess,
//     deleteAssessmentQuestions
// );

export default router;
