import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  const payload = { userId };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' };

  return jwt.sign(payload, secret, options);
};
