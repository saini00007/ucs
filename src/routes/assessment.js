import express from 'express';
import { 
  createAssessment, 
  getAssessmentById, 
  deleteAssessment ,
  getAllAssessmentsByDepartment
} from '../controllers/assessment.js';

const router = express.Router();

// Route to create a new assessment
router.post('/', createAssessment);

// Route to get an assessment by ID
router.get('/:assessmentId', getAssessmentById);

router.get('/department/:departmentId',getAllAssessmentsByDepartment);

// Route to delete an assessment
router.delete('/:assessmentId', deleteAssessment);

export default router;
