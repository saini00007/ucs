import express from 'express';
import {
  addUser,
  deleteUser,
  updateUser,
  getUsersByDepartment,
  getUsersByCompany,
  getUserById
} from '../controllers/user.js';
const router = express.Router();
import { authorize } from '../middleware/authorize.js';


router.post('/users',addUser);

router.put('/users/:userId', updateUser);

router.delete('/users/:userId', deleteUser);


router.get('/users/departments/:departmentId/', getUsersByDepartment);


router.get('/users/companies/:companyId/',  getUsersByCompany);


router.get('/users/:userId',  getUserById);


export default router;
