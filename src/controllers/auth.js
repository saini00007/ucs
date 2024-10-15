import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Otp } from '../models/index.js'; // Import the User and Otp models from the index file

 // Adjust import based on your project structure
import sendEmail from '../utils/mailer.js';

// Reset Password
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await User.update({ password: hashedPassword }, { where: { user_id: userId } });

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};


export const login = async (req, res) => {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
    }

    try {
        // Check if identifier is in email format
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const user = await User.findOne({
            where: isEmail ? { email: identifier } : { user_id: identifier } // Assuming user_id can be alphanumeric
        });

        // Check if user exists
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid user ID/email or password' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid user ID/email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
        const emailSubject = 'Your OTP Code';
        const emailText = `Hello ${user.username},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`;
        
        await sendEmail(user.email, emailSubject, emailText);

        // Set OTP expiration
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        await Otp.create({ user_id: user.user_id, otp_code: otp, expires_at: otpExpiration }); // Use otp_code instead of otp

        // Send response with token
        res.status(200).json({ success: true, message: 'OTP sent to email', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};



// Verify OTP
export const verifyOtp = async (req, res) => {
    const { token, otp } = req.body;

    if (!token || !otp) {
        return res.status(400).json({ success: false, message: 'Token and OTP are required.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const otpRecord = await Otp.findOne({ where: { user_id: userId, otp_code:otp } });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        const finalToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        await Otp.destroy({ where: { user_id: userId } });

        res.cookie('token', finalToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
};
