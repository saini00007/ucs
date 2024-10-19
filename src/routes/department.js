import express from 'express';
import validate from '../middleware/validate.js';
import departmentSchema from '../joi/department.js';
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

// Update a specific department by ID
router.put('/departments/:departmentId', updateDepartment);

// Delete a specific department by ID
router.delete('/departments/:departmentId', deleteDepartment);

// Create a new department for a specific company
router.post('/departments', validate(departmentSchema), createDepartment);

export default router;
