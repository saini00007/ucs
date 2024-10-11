import jwt from 'jsonwebtoken';
import { query } from '../db/db.js';

export const authenticate = async (req, res, next) => {
  // Log cookies in development mode only
  if (process.env.NODE_ENV === 'development') {
    console.log('Cookies:', req.cookies);
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query('SELECT user_id, username, email, role_id FROM users WHERE user_id = $1', [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    } else {
      return res.status(500).json({ message: 'Failed to authenticate token' });
    }
  }
};
