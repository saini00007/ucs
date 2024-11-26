import jwt from 'jsonwebtoken';
import { User, Department } from '../models/index.js';

export const authenticate = async (req, res, next) => {

  // Retrieve token from the cookies
  const token = req.header("Authorization").replace("Bearer ", "");;

  //if no token provided
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    // Verify the token using the JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //if token is not of session type
    if (decoded.type !== 'session') {
      return res.status(400).json({ success: false, messages: ['Invalid token type'] });
    }
    const user = await User.findOne({
      where: {
        id: decoded.userId,
      },
      attributes: ['id', 'username', 'email', 'roleId', 'companyId'],
      include: [{
        model: Department,
        as: 'departments',
        attributes: ['id', 'departmentName'],
        through: {
          attributes: []
        },
      }]
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
