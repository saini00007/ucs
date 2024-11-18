import jwt from 'jsonwebtoken';

export const generateToken = (userId, type, expiresIn = '15m') => {
  try {
    if (!userId || !type) {
      throw new Error('userId and type are required to generate a token');
    }
    const payload = { userId, type };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    const options = { expiresIn };
    const token = jwt.sign(payload, secret, options);
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Token generation failed');
  }
};
