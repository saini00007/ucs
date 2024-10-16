import { User } from '../../models/index.js';

export const authorizeUser = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated.' });
        }

        const userRoleId = req.user.role_id;
        const userCompanyId = req.user.company_id;
        const userDepartmentId = req.user.department_id;

        if (!allowedRoles.includes(userRoleId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Insufficient permissions.' });
        }

        const { departmentId, companyId } = req.query;

        if (req.method === 'GET' && departmentId) {
            if (userDepartmentId === departmentId && userCompanyId === companyId) {
                return next();
            }
            return res.status(403).json({ success: false, message: 'Unauthorized: You can only view users from your own department and company.' });
        }

        if (req.method === 'POST') {
            return next();
        }

        if (req.method === 'PUT' || req.method === 'DELETE') {
            return next();
        }

        return res.status(403).json({ success: false, message: 'Unauthorized: Insufficient permissions.' });
    };
};
