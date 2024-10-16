import express from 'express';
import {
  addUser,
  deleteUser,
  updateUser,
  getUsersByDepartment,
  getUsersByCompany,
  getUserById
} from '../controllers/user.js'; // Importing your specified controller functions
import { authorizeUser } from '../middleware/authorize/authorizeUser.js';

const router = express.Router();

import mockAuthenticate from '../middleware/mockAuth.js';
import { authenticate } from '../middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Route to add a new user
router.post('/users', authorizeUser([1, 2]), addUser);

// Route to update an existing user
router.put('/users/:userId', authorizeUser([1, 2]), updateUser);

// Route to delete a user
router.delete('/users/:userId', authorizeUser([1, 2]), deleteUser);


router.get('/departments/:departmentId/users', authorizeUser([1, 2, 3]), getUsersByDepartment);


router.get('/companies/:companyId/users', authorizeUser([1, 2, 3]), getUsersByCompany);


router.get('/users/:userId', authorizeUser([1, 2, 3]), getUserById);


export default router;
