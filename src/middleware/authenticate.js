import jwt from 'jsonwebtoken';
import  User  from '../models/User.js'; // Import your User model

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

    // Use Sequelize to find the user by userId
    const user = await User.findOne({
      where: {
        user_id: decoded.userId,
      },
      attributes: ['user_id', 'username', 'email', 'role_id'], // Specify attributes to retrieve
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // Attach the user object to the request
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
