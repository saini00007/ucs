import { Assessment, User } from '../../models/index.js';

export const authorizeAssessment = (allowedRoles = []) => {
    return async (req, res, next) => {
        const userRoleId = req.user.role_id;
        const userId = req.user.user_id;
        const { assessmentId } = req.params;

        if (userRoleId === '1') {
            return next();
        }

        if (allowedRoles.length && !allowedRoles.includes(userRoleId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Insufficient permissions.' });
        }

        try {
            const assessment = await Assessment.findOne({
                where: { assessment_id: assessmentId },
                attributes: ['department_id']
            });

            if (!assessment) {
                return res.status(404).json({ success: false, message: 'Assessment not found.' });
            }

            const userInDepartment = await User.findOne({
                where: { user_id: userId, department_id: assessment.department_id },
                attributes: ['user_id']
            });

            if (!userInDepartment) {
                return res.status(403).json({ success: false, message: 'Unauthorized: You do not belong to this department.' });
            }

            return next();
        } catch (error) {
            console.error('Error during assessment authorization:', error);
            return res.status(500).json({ success: false, message: 'Internal server error during authorization.' });
        }
    };
};
