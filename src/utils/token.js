import jwt from 'jsonwebtoken';

export const generateToken = (userId, expiresIn = '15m') => {
  console.log('lol');
  console.log(userId);
  const payload = { userId };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn };
  return jwt.sign(payload, secret, options);
};
