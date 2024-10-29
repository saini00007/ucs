import express from 'express';
import validate from '../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../joi/department.js';

import {
  getAllDepartmentsForCompany,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/department.js';

const router = express.Router();

router.get('/companies/:companyId/departments', getAllDepartmentsForCompany);
router.get('/departments/:departmentId', getDepartmentById);
router.put('/departments/:departmentId', validate(updateDepartmentSchema), updateDepartment);
router.delete('/departments/:departmentId', deleteDepartment);
router.post('/departments',validate(createDepartmentSchema), createDepartment);

export default router;
