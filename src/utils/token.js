import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

const generateToken = (userId, type, expiresIn = '15m') => {
  try {
    if (!userId || !type) {
      throw new AppError('userId and type are required to generate a token', 400);
    }
    const payload = { userId, type };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('JWT_SECRET is not defined', 500);
    }
    const options = { expiresIn };
    const token = jwt.sign(payload, secret, options);
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new AppError('Token generation failed', 500);
  }
};

export default generateToken;
