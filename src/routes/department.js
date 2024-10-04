import express from 'express';
import {
  getAllDepartmentsForCompany,
  getDepartmentById,
  createDepartment,
} from '../controllers/department.js';

const router = express.Router();

router.get('/companies/:companyId/departments', getAllDepartmentsForCompany);

router.get('/departments/:departmentId', getDepartmentById);

router.post('/companies/:companyId/departments', createDepartment);

export default router;
