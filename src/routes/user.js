import express from 'express';
import {
  addAdminToCompany,
  addUserToDepartment,
} from '../controllers/user.js';

const router = express.Router();

// Route to add an admin to a company
router.post('/companies/:companyId/admins', addAdminToCompany);

// Route to add a user to a department
router.post('/departments/:departmentId/users', addUserToDepartment);

export default router;
