import express from 'express';
import { 
    markAssessmentAsStarted, 
    getAssessmentById, 
    getAllAssessments 
} from '../controllers/assessment.js';
import { authorizeAssessment } from '../middleware/authorize/authorizeAssessment.js';

const router = express.Router();

import mockAuthenticate from '../middleware/mockAuth.js';
import { authenticate } from '../middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;
router.use(authMiddleware);

// Route to mark an assessment as started
router.put('/assessments/:assessmentId/start',authorizeAssessment(['1','2','3','4']), markAssessmentAsStarted);

// Route to get an assessment by ID
router.get('/assessments/:assessmentId',authorizeAssessment(['1','2','3','4','5']), getAssessmentById);

// Route to get all assessments for a specific department
router.get('/departments/:departmentId/assessments',authorizeAssessment(['1','2']), getAllAssessments);

export default router;
