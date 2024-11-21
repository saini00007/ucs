import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Otp,Department } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import { generateToken } from '../utils/token.js';

export const requestPasswordReset = async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, messages: ['Email or user ID is required.'] });
  }

  try {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    const user = await User.findOne({
      where: isEmail ? { email: identifier } : { id: identifier }
    });
    if (!user) {
      return res.status(404).json({ success: false, messages: ['No user found with this identifier.'] });
    }

    const token = generateToken(user.id, 'reset-password');

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const emailSubject = 'Password Reset Request';
    const emailText = `Hello ${user.username},\n\nClick the following link to reset your password: ${resetLink}\n\nThis link will expire in 15 minutes.`;

    await sendEmail(user.email, emailSubject, emailText);

    res.status(200).json({ success: true, messages: ['Password reset link sent to email'] });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ success: false, messages: ['Failed to request password reset'] });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, messages: ['Token and new password are required.'] });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'reset-password') {
      return res.status(400).json({ success: false, messages: ['Invalid token type'] });
    }

    const userId = decoded.userId;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { id: userId } });

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

    const token = generateToken(user.id, 'login', '5m');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailSubject = 'Your OTP Code';
    const emailText = `Hello ${user.username},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`;

    await sendEmail(user.email, emailSubject, emailText);

    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({ userId: user.id, otpCode: otp, expiresAt: otpExpiration });

    res.status(200).json({ success: true, messages: ['OTP sent to email'], token, otp: `${otp} ----for development purpose only` });
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

    if (decoded.type !== 'login') {
      return res.status(400).json({ success: false, messages: ['Invalid token type'] });
    }

    const otpRecord = await Otp.findOne({ where: { userId, otpCode: otp } });

    if (!otpRecord) {
      return res.status(400).json({ success: false, messages: ['Invalid OTP'] });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, messages: ['OTP expired'] });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'roleId', 'companyId', 'phoneNumber'],
      include: [
        {
          model: Department,
          as: 'departments',
          attributes: ['id', 'departmentName'],
          through: {
            attributes: []
          },
        },
      ],
    });

    if (!user) {
      return res.status(400).json({ success: false, messages: ['Invalid user ID'] });
    }

    const finalToken = generateToken(userId, 'session', '2d');

    await Otp.destroy({ where: { userId } });

    // Set the cookie for the session token
    res.cookie('session_token', finalToken, {
      httpOnly: true, // To prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // Ensure this is true in production (HTTPS)
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days (cookie expiry)
      sameSite: 'Strict', // Cookie only sent for requests to the same site
    });

    res.status(200).json({
      success: true,
      messages: ['OTP verified successfully'],
      token: finalToken,
      user,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, messages: ['Failed to verify OTP'] });
  }
};


