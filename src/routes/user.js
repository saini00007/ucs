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


// Route to add a new user
router.post('/users',authorize([1,2]) ,addUser);

// Route to update an existing user
router.put('/users/:userId',authorize([1,2]), updateUser);

// Route to delete a user
router.delete('/users/:userId', deleteUser);


router.get('/departments/:departmentId/users', getUsersByDepartment);


router.get('/companies/:companyId/users',  getUsersByCompany);


router.get('/users/:userId',  getUserById);


export default router;
