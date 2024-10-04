import express from 'express';
import { resetPassword,login, verifyOtp } from '../controllers/auth.js';

const router = express.Router();

router.post('/verify-otp',verifyOtp)
router.post('/login',login)
router.post('/reset-password', resetPassword);

export default router;
