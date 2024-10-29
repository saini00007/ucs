import express from 'express';
import {
  addUser,
  deleteUser,
  updateUser,
  getUsersByDepartment,
  getUsersByCompany,
  getUserById
} from '../controllers/user.js';
import validate from '../middleware/validate.js';
import {createUserSchema,updateUserSchema} from '../joi/user.js';

const router = express.Router();

router.post('/users', validate(createUserSchema), addUser);
router.put('/users/:userId', validate(updateUserSchema), updateUser);
router.delete('/users/:userId', deleteUser);
router.get('/departments/:departmentId/users', getUsersByDepartment);
router.get('/companies/:companyId/users', getUsersByCompany);
router.get('/users/:userId',getUserById);

export default router;
