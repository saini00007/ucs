import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { query } from '../db/db.js';
import sendEmail from '../utils/mailer.js';

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the JWT token to get the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    const userId = decoded.userId;

    // Hash the new password before storing it in the database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password in the database
    await query(`UPDATE users SET password = $1 WHERE user_id = $2`, [hashedPassword, userId]);


    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// Handle user login process
export const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Determine if the identifier is a user ID or email
    const isNumeric = !isNaN(identifier);
    
    // Query the database for the user based on the identifier
    const result = await query(`
      SELECT * FROM users WHERE 
      (${isNumeric ? 'user_id = $1' : 'email = $1'})
    `, [identifier]);

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid user ID/email or password' });
    }

    const user = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid user ID/email or password' });
    }

    // Generate a JWT token for the authenticated user
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create a random OTP and send it to the user's email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailSubject = 'Your OTP Code';
    const emailText = `Hello ${user.username},\n\nYour OTP code is: ${otp}\n\nThis code will expire in 5 minutes.`;
    await sendEmail(user.email, emailSubject, emailText);

    // Save the OTP in the database with an expiration time of 5 minutes
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
    await query(`INSERT INTO otps (user_id, otp, expires_at) VALUES ($1, $2, $3)`, [user.user_id, otp, otpExpiration]);

    res.status(200).json({ success: true, message: 'OTP sent to email', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// Verify the OTP provided by the user
export const verifyOtp = async (req, res) => {
  const { token, otp } = req.body;

  try {
    // Verify the JWT token to get the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if the provided OTP matches the one stored in the database
    const result = await query(`SELECT * FROM otps WHERE user_id = $1 AND otp = $2`, [userId, otp]);
    
    // If no matching OTP is found, return an error response
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const otpRecord = result.rows[0];
    
    // Check if the OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Generate a final JWT token for the user's session
    const finalToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Optionally, delete the used OTP from the database
    await query(`DELETE FROM otps WHERE user_id = $1`, [userId]);

    res.status(200).json({ success: true, message: 'OTP verified successfully', token: finalToken });
  } catch (error) {
    // Log any error that occurs during OTP verification
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
