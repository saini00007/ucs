import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Otp, Department, Company } from '../models/index.js';
import sendEmail from '../utils/mailer.js';
import generateToken from '../utils/token.js';
import AppError from '../utils/AppError.js';

export const requestPasswordReset = async (req, res, next) => {
  const { identifier } = req.body;

  // Validate if the identifier is provided
  if (!identifier) {
    throw new AppError('Email or user ID is required.', 400);
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
      throw new AppError('No user found with this identifier.', 404);
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
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  // Validate if token and new password are provided
  if (!token || !newPassword) {
    throw new AppError('Token and new password are required.', 400);
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token is of type 'reset-password'
    if (decoded.type !== 'reset-password') {
      throw new AppError('Invalid token type', 400);
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
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { identifier, password } = req.body;

  console.log(req.body);

  // Validate if identifier and password are provided
  if (!identifier || !password) {
    throw new AppError('Identifier and password are required.', 400);
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
      throw new AppError('Invalid user ID/email or password', 400);
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid user ID/email or password', 400);
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
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  const { token, otp } = req.body;

  try {
    // Validate if both token and OTP are provided
    if (!token || !otp) {
      throw new AppError('Token and OTP are required.', 400);
    }
    // Verify the provided token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Ensure the token is for 'login' type
    if (decoded.type !== 'login') {
      throw new AppError('Invalid token type', 400);
    }

    // Find OTP record for the user
    const otpRecord = await Otp.findOne({ where: { userId, otpCode: otp } });

    // If OTP is not found, return an error
    if (!otpRecord) {
      throw new AppError('Invalid OTP', 400);
    }

    // Check if the OTP has expired
    if (new Date(otpRecord.expiresAt) < new Date()) {
      throw new AppError('OTP expired', 400);
    }

    // Fetch user details, including associated departments and company
    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'middleName', 'email', 'roleId', 'companyId', 'phoneNumber'],
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
          attributes: ['id', 'companyLegalName'],
        }
      ],
    });

    // If user is not found, return an error
    if (!user) {
      throw new AppError('Invalid user ID', 400);
    }

    // Generate a session token for the user
    const finalToken = generateToken(userId, 'session', '2d');

    // Destroy the OTP record to prevent reuse
    await Otp.destroy({ where: { userId } });

    // Respond with success and user data
    res.status(200).json({
      success: true,
      messages: ['OTP verified successfully'],
      token: finalToken,
      user,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  const { token } = req.body;

  // Validate if token is provided
  if (!token) {
    throw new AppError('Token is required.', 400);
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure the token is for 'login' type
    if (decoded.type !== 'login') {
      throw new AppError('Invalid token type', 400);
    }

    const userId = decoded.userId;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete any existing OTP for this user
    await Otp.destroy({ where: { userId } });

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate a new login token (optional - if you want to reset the 5-minute window)
    const newToken = generateToken(userId, 'login', '5m');

    // Prepare and send email
    const emailSubject = 'Your New OTP Code';
    const emailText = `Hello ${user.username},\n\nYour new OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`;
    
    await sendEmail(user.email, emailSubject, emailText);

    // Save new OTP to database
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({ 
      userId: user.id, 
      otpCode: otp, 
      expiresAt: otpExpiration 
    });

    // Send response
    res.status(200).json({ 
      success: true, 
      messages: ['New OTP sent to email'], 
      token: newToken,
      otp: `${otp} ----for development purpose only`
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    next(error);
  }
};




