import express from 'express';
import {
  addUser,
  deleteUser,
  updateUser,
  getUserById,
  removeUserFromDepartment,
  getDepartmentsByUserId,
  addUserToDepartment
} from '../controllers/user.js';
import validate from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../joi/user.js';
import checkAccess from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

// Route to add a new user
router.post('/',
  (req, res, next) => {
    if (req.body.roleId === 'admin') {
      return attachResourceInfo('User', 'Company', 'companyId', 'create')(req, res, next);
    }
    return attachResourceInfo('User', 'Department', 'departmentId', 'create')(req, res, next);
  },
  checkAccess,
  validate(createUserSchema),
  addUser
);

// Route to update an existing user
router.put('/:userId',
  attachResourceInfo('User', 'User', 'userId', 'update'),
  checkAccess,
  validate(updateUserSchema),
  updateUser
);

// Route to delete a user
router.delete('/:userId',
  attachResourceInfo('User', 'User', 'userId', 'remove'),
  checkAccess,
  deleteUser
);

// Route to get a user by ID
router.get('/:userId',
  attachResourceInfo('User', 'User', 'userId', 'read'),
  checkAccess,
  getUserById
);

// Route to get departments associated with a user by user ID
router.get('/:userId/departments',
  attachResourceInfo('User', 'User', 'userId', 'read'),
  checkAccess,
  getDepartmentsByUserId
);

// Route to remove a user from a department
router.delete('/:userId/departments/:departmentId',
  attachResourceInfo('UserDepartmentLink', 'User', 'userId', 'remove'),
  checkAccess,
  removeUserFromDepartment
);

// Route to add a user to a department
router.post('/:userId/departments/:departmentId',
  attachResourceInfo('UserDepartmentLink', 'Department', 'departmentId', 'create'),
  checkAccess,
  addUserToDepartment
);

export default router;
