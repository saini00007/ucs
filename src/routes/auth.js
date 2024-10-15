import express from 'express';
import { resetPassword, login, verifyOtp } from '../controllers/auth.js';

const router = express.Router();

// Route to verify OTP
router.post('/verify-otp', verifyOtp);

// Route to log in the user
router.post('/login', login);

// Route to reset the password
router.post('/reset-password', resetPassword);

export default router;
