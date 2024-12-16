import jwt from 'jsonwebtoken';
import { User, Department } from '../models/index.js';
import AppError from '../utils/AppError.js';

const authenticate = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        // If no token is provided
        if (!token) {
            throw new AppError('No token provided', 401);
        }

        // Verify the token using the JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // If token is not of session type
        if (decoded.type !== 'session') {
            throw new AppError('Invalid token type', 400);
        }

        // Retrieve the user from the database
        const user = await User.findOne({
            where: { id: decoded.userId },
            attributes: ['id', 'username', 'email', 'roleId', 'companyId'],
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id', 'departmentName'],
                through: { attributes: [] }
            }]
        });

        if (!user) {
            throw new AppError('User not found', 401);
        }

        // Attach the user to the request object
        req.user = user;
        next();

    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else if (error.name === 'TokenExpiredError') {
            next(new AppError('Token expired', 403));
        } else if (error.name === 'JsonWebTokenError') {
            next(new AppError('Invalid token', 403));
        } else {
            next(new AppError('Failed to authenticate token', 500));
        }
    }
};

export default authenticate;