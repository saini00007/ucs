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
import { createUserSchema, updateUserSchema } from '../joi/user.js';
import { checkAccess } from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';

const router = express.Router();

router.post('/users',
  validate(createUserSchema),
  (req, res, next) => {
    if (req.body.roleId === 'admin') {
      return attachResourceInfo('User', 'Company', 'companyId', 'create')(req, res, next);
    }
    return attachResourceInfo('User', 'Department', 'departmentId', 'create')(req, res, next);
  },
  checkAccess,
  addUser
);

// Route to update an existing user
router.put('/users/:userId',
  validate(updateUserSchema),
  attachResourceInfo('User', 'User', 'userId', 'update'),
  checkAccess,
  updateUser
);

// Route to delete a user
router.delete('/users/:userId',
  attachResourceInfo('User', 'User', 'userId', 'remove'),
  checkAccess,
  deleteUser
);

// Route to get users by department
router.get('/departments/:departmentId/users',
  attachResourceInfo('User', 'Department', 'departmentId', 'list'),
  checkAccess,
  getUsersByDepartment
);

// Route to get users by company
router.get('/companies/:companyId/users',
  attachResourceInfo('User', 'Company', 'companyId', 'list'),
  checkAccess,
  getUsersByCompany
);

// Route to get users by company and role
// router.get('/companies/:companyId/users/role/:roleId',
//   attachResourceInfo('User', 'Company', 'companyId', 'list'),
//   checkAccess,
//   getUsersByRole
// );

// Route to get a user by ID
router.get('/users/:userId',
  attachResourceInfo('User', 'User', 'userId', 'read'),
  checkAccess,
  getUserById
);

export default router;
