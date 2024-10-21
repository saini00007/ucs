import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Otp } from '../models/index.js';
import sendEmail from '../utils/mailer.js';

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, messages: ['Token and new password are required.'] });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { id:userId } });

    res.status(200).json({ success: true, messages: ['Password reset successfully'] });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, messages: ['Failed to reset password'] });
  }
};

export const login = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ success: false, messages: ['Identifier and password are required.'] });
    }

    try {
        // Check if the identifier is an email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        
        const user = await User.findOne({
            where: isEmail ? { email: identifier } : { id: identifier },
        });

        if (!user) {
            return res.status(400).json({ success: false, messages: ['Invalid user ID/email or password'] });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, messages: ['Invalid user ID/email or password'] });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const emailSubject = 'Your OTP Code';
        const emailText = `Hello ${user.username},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`;

        await sendEmail(user.email, emailSubject, emailText);

        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
        await Otp.create({ userId: user.id, otpCode: otp, expiresAt: otpExpiration });

        res.status(200).json({ success: true, messages: ['OTP sent to email'], token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, messages: ['Login failed'] });
    }
};


export const verifyOtp = async (req, res) => {
  const { token, otp } = req.body;

  if (!token || !otp) {
    return res.status(400).json({ success: false, messages: ['Token and OTP are required.'] });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const otpRecord = await Otp.findOne({ where: { userId, otpCode: otp } });

    if (!otpRecord) {
      return res.status(400).json({ success: false, messages: ['Invalid OTP'] });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, messages: ['OTP expired'] });
    }

    const finalToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await Otp.destroy({ where: { userId } });

    res.cookie('token', finalToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
    res.status(200).json({ success: true, messages: ['OTP verified successfully'] });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, messages: ['Failed to verify OTP'] });
  }
};
