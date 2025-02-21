import express from 'express';
import {
  addUser,
  deleteUser,
  updateUser,
  getUserById,
  removeUserFromDepartment,
  getDepartmentsByUserId,
  addUserToDepartment,
  removeUserFromSubDepartment,
  addUserToSubDepartment,
  getSubAssessmentByUserId,
} from '../controllers/user.js';
import validate from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../joi/user.js';
import checkAccess from '../middleware/authorize.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import { RESOURCE_TYPES, ACTION_IDS, ROLE_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';
import { getSubDepartmentsByDepartmentId } from '../controllers/department.js';

const router = express.Router();


router.get('/:userId/sub-assessments',getSubAssessmentByUserId);


// Route to add a new user
router.post('/',
  // (req, res, next) => {
  //   if (req.body.roleId === ROLE_IDS.ADMIN || req.body.roleId === ROLE_IDS.LEADERSHIP) {
  //     return attachResourceInfo(
  //       RESOURCE_TYPES.USER,
  //       CONTENT_RESOURCE_TYPES.COMPANY,
  //       'companyId',
  //       ACTION_IDS.CREATE
  //     )(req, res, next);
  //   }
  //   return attachResourceInfo(
  //     RESOURCE_TYPES.USER,
  //     CONTENT_RESOURCE_TYPES.DEPARTMENT,
  //     'departmentId',
  //     ACTION_IDS.CREATE
  //   )(req, res, next);
  // },
  // checkAccess,
  // validate(createUserSchema),
  addUser
);

// Route to update an existing user
router.put('/:userId',
  attachResourceInfo(
    RESOURCE_TYPES.USER,
    CONTENT_RESOURCE_TYPES.USER,
    'userId',
    ACTION_IDS.UPDATE
  ),
  checkAccess,
  // validate(updateUserSchema),
  updateUser
);

// Route to delete a user
router.delete('/:userId',
  attachResourceInfo(
    RESOURCE_TYPES.USER,
    CONTENT_RESOURCE_TYPES.USER,
    'userId',
    ACTION_IDS.REMOVE
  ),
  checkAccess,
  deleteUser
);

// Route to get a user by ID
router.get('/:userId',
  attachResourceInfo(
    RESOURCE_TYPES.USER,
    CONTENT_RESOURCE_TYPES.USER,
    'userId',
    ACTION_IDS.READ
  ),
  checkAccess,
  getUserById
);

// Route to get departments associated with a user by user ID
router.get('/:userId/departments',
  attachResourceInfo(
    RESOURCE_TYPES.USER,
    CONTENT_RESOURCE_TYPES.USER,
    'userId',
    ACTION_IDS.READ
  ),
  checkAccess,
  getDepartmentsByUserId
);



// Route to remove a user from a department
router.delete('/:userId/departments/:departmentId',
  attachResourceInfo(
    RESOURCE_TYPES.USER_DEPARTMENT_LINK,
    CONTENT_RESOURCE_TYPES.DEPARTMENT,
    'departmentId',
    ACTION_IDS.REMOVE
  ),
  checkAccess,
  removeUserFromDepartment
);

// Route to add a user to a department
router.post('/:userId/departments/:departmentId',
  attachResourceInfo(
    RESOURCE_TYPES.USER_DEPARTMENT_LINK,
    CONTENT_RESOURCE_TYPES.DEPARTMENT,
    'departmentId',
    ACTION_IDS.CREATE
  ),
  checkAccess,
  addUserToDepartment
);

// Route to remove a user from a department
router.delete('/:userId/sub-departments/:subDepartmentId',
  attachResourceInfo(
    RESOURCE_TYPES.USER_SUB_DEPARTMENT_LINK,
    CONTENT_RESOURCE_TYPES.SUB_DEPARTMENT,
    'subDepartmentId',
    ACTION_IDS.REMOVE
  ),
  checkAccess,
  removeUserFromSubDepartment
);

// Route to add a user to a department
router.post('/:userId/sub-departments/:subDepartmentId',
  attachResourceInfo(
    RESOURCE_TYPES.USER_SUB_DEPARTMENT_LINK,
    CONTENT_RESOURCE_TYPES.SUB_DEPARTMENT,
    'subDepartmentId',
    ACTION_IDS.CREATE
  ),
  checkAccess,
  addUserToSubDepartment
);

export default router;