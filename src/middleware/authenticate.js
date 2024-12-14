import jwt from 'jsonwebtoken';
import { User, Department } from '../models/index.js';

const authenticate = async (req, res, next) => {

  try {

    const token = req.header("Authorization")?.replace("Bearer ", "");

    //if no token provided
    if (!token) {
      return res.status(401).json({ success: false, messages: ['No token provided'] });
    }
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
      return res.status(401).json({ success: false, messages: ['User not found'] });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, messages: ['Token expired'] });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, messages: ['Invalid token'] });
    } else {
      return res.status(500).json({ success: false, messages: ['Failed to authenticate token'] });
    }
  }
};
export default authenticate;