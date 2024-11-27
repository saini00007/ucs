import express from 'express';
import { resetPassword, login, verifyOtp, requestPasswordReset } from '../controllers/auth.js';

const router = express.Router();

// Route to verify OTP
router.post('/verify-otp', verifyOtp);

// Route to log in
router.post('/login', login);

// Route to reset password
router.post('/reset-password', resetPassword);

// Route to request a password reset
router.post('/request-password-reset', requestPasswordReset);

export default router;
