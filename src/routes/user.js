import express from 'express';
import {
  addUser,
  deleteUser,
  updateUser,
  getUsersByDepartment,
  getUsersByCompany,
  getUsersByRole,
  getUserById
} from '../controllers/user.js';
import validate from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../joi/user.js';
import { checkAccess } from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

router.post('/departments/:departmentId/users', validate(createUserSchema),
  attachResourceInfo('User', 'Department', 'departmentId', 'create'),
  checkAccess,
  addUser
);

router.put('/users/:userId', validate(updateUserSchema),
  attachResourceInfo('User', 'User', 'userId', 'update'),
  checkAccess,
  updateUser);

router.delete('/users/:userId',
  attachResourceInfo('User', 'User', 'userId', 'remove'),
  checkAccess,
  deleteUser);

router.get('/departments/:departmentId/users',
  attachResourceInfo('User', 'Department', 'departmentId', 'list'),
  checkAccess,
  getUsersByDepartment);

router.get('/companies/:companyId/users',
  attachResourceInfo('User', 'Company', 'companyId', 'list'),
  checkAccess,
  getUsersByCompany);

router.get('/companies/:companyId/users/role/:roleId',
  attachResourceInfo('User', 'Company', 'companyId', 'list'),
  checkAccess,
  getUsersByRole);

router.get('/users/:userId',
  attachResourceInfo('User', 'User', 'userId', 'read'),
  checkAccess,
  getUserById);

export default router;
