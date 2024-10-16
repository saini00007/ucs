import express from 'express';
import { 
  getAllDepartmentsForCompany, 
  getDepartmentById, 
  createDepartment, 
  updateDepartment,
  deleteDepartment
} from '../controllers/department.js';

const router = express.Router();

router.get('/companies/:companyId/departments', getAllDepartmentsForCompany);

// Get a specific department by ID
router.get('/departments/:departmentId', getDepartmentById);
router.put('/departments/:departmentId', updateDepartment);
router.delete('/departments/:departmentId', deleteDepartment);


// Create a new department for a specific company
router.post('/companies/:companyId/departments', createDepartment);

export default router;
