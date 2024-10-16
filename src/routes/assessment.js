import express from 'express';
import { 
    markAssessmentAsStarted, 
    getAssessmentById, 
    getAllAssessments 
} from '../controllers/assessment.js';

const router = express.Router();


// Route to mark an assessment as started
router.put('/assessments/:assessmentId/start', markAssessmentAsStarted);

// Route to get an assessment by ID
router.get('/assessments/:assessmentId', getAssessmentById);

// Route to get all assessments for a specific department
router.get('/departments/:departmentId/assessments', getAllAssessments);

export default router;
