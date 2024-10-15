import express from 'express';
import { addUser, deleteUser, updateUser } from '../controllers/user.js'; // Assuming you've updated your controller to have addUser

const router = express.Router();

router.post('/users', addUser);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);


export default router;
