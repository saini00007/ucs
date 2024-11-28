import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Otp, Department, Company } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import  generateToken  from '../utils/token.js';

export const requestPasswordReset = async (req, res) => {
  const { identifier } = req.body;

  // Validate if the identifier is provided
  if (!identifier) {
    return res.status(400).json({ success: false, messages: ['Email or user ID is required.'] });
  }

  try {
    // Check if the identifier is an email or a user ID
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    // Look for a user based on either the email or user ID
    const user = await User.findOne({
      where: isEmail ? { email: identifier } : { id: identifier }
    });

    // If no user is found with the provided identifier, return a 404 error
    if (!user) {
      return res.status(404).json({ success: false, messages: ['No user found with this identifier.'] });
    }

    // Generate a reset token for the user
    const token = generateToken(user.id, 'reset-password');

    // Create the password reset link to be sent to the user
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    // Prepare the email content
    const emailSubject = 'Password Reset Request';
    const emailText = `Hello ${user.username},\n\nClick the following link to reset your password: ${resetLink}\n\nThis link will expire in 15 minutes.`;

    // Send the password reset email to the user
    await sendEmail(user.email, emailSubject, emailText);

    // Return a success message indicating the email was sent
    res.status(200).json({ success: true, messages: ['Password reset link sent to email'] });
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error requesting password reset:', error);

    // Return a 500 error if something goes wrong
    res.status(500).json({ success: false, messages: ['Failed to request password reset'] });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  // Validate if token and new password are provided
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, messages: ['Token and new password are required.'] });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token is of type 'reset-password'
    if (decoded.type !== 'reset-password') {
      return res.status(400).json({ success: false, messages: ['Invalid token type'] });
    }

    const userId = decoded.userId;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await User.update({ password: hashedPassword }, { where: { id: userId } });

    // Respond with success
    res.status(200).json({ success: true, messages: ['Password reset successfully'] });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, messages: ['Failed to reset password'] });
  }
};

export const login = async (req, res) => {
  const { identifier, password } = req.body;
  console.log(req.body);

  // Validate if identifier and password are provided
  if (!identifier || !password) {
    return res.status(400).json({ success: false, messages: ['Identifier and password are required.'] });
  }

  try {
    // Check if the identifier is an email or user ID
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    // Find user by email or user ID
    const user = await User.findOne({
      where: isEmail ? { email: identifier } : { id: identifier },
    });

    // If user not found, return an error
    if (!user) {
      return res.status(400).json({ success: false, messages: ['Invalid user ID/email or password'] });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, messages: ['Invalid user ID/email or password'] });
    }

    // Generate a login token
    const token = generateToken(user.id, 'login', '5m');

    // Generate an OTP for extra authentication
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailSubject = 'Your OTP Code';
    const emailText = `Hello ${user.username},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`;

    // Send the OTP via email
    await sendEmail(user.email, emailSubject, emailText);

    // Set OTP expiration time and save the OTP
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({ userId: user.id, otpCode: otp, expiresAt: otpExpiration });

    // Respond with success and OTP (only for development purposes)
    res.status(200).json({ success: true, messages: ['OTP sent to email'], token, otp: `${otp} ----for development purpose only` });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, messages: ['Login failed'] });
  }
};

export const verifyOtp = async (req, res) => {
  const { token, otp } = req.body;

  // Validate if both token and OTP are provided
  if (!token || !otp) {
    return res.status(400).json({ success: false, messages: ['Token and OTP are required.'] });
  }

  try {
    // Verify the provided token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Ensure the token is for 'login' type
    if (decoded.type !== 'login') {
      return res.status(400).json({ success: false, messages: ['Invalid token type'] });
    }

    // Find OTP record for the user
    const otpRecord = await Otp.findOne({ where: { userId, otpCode: otp } });

    // If OTP is not found, return an error
    if (!otpRecord) {
      return res.status(400).json({ success: false, messages: ['Invalid OTP'] });
    }

    // Check if the OTP has expired
    if (new Date(otpRecord.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, messages: ['OTP expired'] });
    }

    // Fetch user details, including associated departments and company
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
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'companyName'],
        }
      ],
    });

    // If user is not found, return an error
    if (!user) {
      return res.status(400).json({ success: false, messages: ['Invalid user ID'] });
    }

    // Generate a session token for the user
    const finalToken = generateToken(userId, 'session', '2d');

    // Destroy the OTP record to prevent reuse
    await Otp.destroy({ where: { userId } });

    // Set the session token as a secure HTTP-only cookie
    res.cookie('session_token', finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
      sameSite: 'Strict',
    });

    // Respond with success and user data
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



