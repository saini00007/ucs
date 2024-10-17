import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import your User model

export const authenticate = async (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Cookies:', req.cookies);
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: {
        userId: decoded.userId, // Updated to camelCase
      },
      attributes: ['userId', 'username', 'email', 'roleId'], // Specify attributes to retrieve in camelCase
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to authenticate token' });
    }
  }
};
