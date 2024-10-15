import express from 'express';
import { 
  getAllDepartmentsForCompany, 
  getDepartmentById, 
  createDepartment, 
  updateDepartment,
  deleteDepartment
} from '../controllers/department.js';
import { authorize } from '../middleware/authorize.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticate);

// Get all departments for a specific company
router.get('/companies/:companyId/departments', getAllDepartmentsForCompany);

// Get a specific department by ID
router.get('/departments/:departmentId', getDepartmentById);
router.put('/departments/:departmentId', updateDepartment);
router.delete('/departments/:departmentId', deleteDepartment);


// Create a new department for a specific company
router.post('/companies/:companyId/departments', createDepartment);

export default router;
