import express from 'express';
import {
  getAllDepartmentsForCompany,
  getDepartmentById,
  createDepartment,
} from '../controllers/department.js';

const router = express.Router();

// Route to get all departments for a specific company
router.get('/company/:companyId', getAllDepartmentsForCompany);

// Route to get a single department by ID
router.get('/:departmentId', getDepartmentById);

// Route to create a new department within a specific company
router.post('/', createDepartment);

export default router;
