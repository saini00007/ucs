import express from 'express';
import { 
  getAllDepartmentsForCompany, 
  getDepartmentById, 
  createDepartment, 
  updateDepartment,
  deleteDepartment
} from '../controllers/department.js';
import { authorizeDepartment } from '../middleware/authorize/authorizeDepartment.js';

const router = express.Router();

import mockAuthenticate from '../middleware/mockAuth.js';
import { authenticate } from '../middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;
router.use(authMiddleware);

// Apply authentication middleware to all routes
// router.use(authenticate);

// Get all departments for a specific company
router.get('/companies/:companyId/departments',authorizeDepartment([1,2]), getAllDepartmentsForCompany);

// Get a specific department by ID
router.get('/departments/:departmentId',authorizeDepartment([1,2,3,4,5,6]), getDepartmentById);
router.put('/departments/:departmentId',authorizeDepartment([1,2]), updateDepartment);
router.delete('/departments/:departmentId',authorizeDepartment([1,2]), deleteDepartment);


// Create a new department for a specific company
router.post('/companies/:companyId/departments',authorizeDepartment([1,2]), createDepartment);

export default router;
