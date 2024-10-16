import { Department, User } from '../../models/index.js';

export const authorizeDepartment = (allowedRoles = []) => {
    return async (req, res, next) => {
        const userRoleId = req.user.role_id;
        const userId = req.user.user_id;
        const { departmentId } = req.params;

        if (userRoleId === '1') {
            return next();
        }

        if (allowedRoles.length && !allowedRoles.includes(userRoleId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Insufficient permissions.' });
        }

        try {
            const user = await User.findOne({
                where: { user_id: userId, department_id: departmentId },
                attributes: ['user_id']
            });

            if (!user) {
                return res.status(403).json({ success: false, message: 'Unauthorized: You do not belong to this department.' });
            }

            return next();
        } catch (error) {
            console.error('Error during department authorization:', error);
            return res.status(500).json({ success: false, message: 'Internal server error during authorization.' });
        }
    };
};
