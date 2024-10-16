import { Answer, User, Assessment } from '../../models/index.js';

export const authorizeAnswer = (allowedRoles = []) => {
    return async (req, res, next) => {
        const userRoleId = req.user.role_id;
        const userId = req.user.user_id;
        const { answerId, assessmentId } = req.params;

        if (userRoleId === '1') return next();

        if (allowedRoles.length && !allowedRoles.includes(userRoleId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Insufficient permissions.' });
        }

        try {
            const assessment = await Assessment.findOne({
                where: { assessment_id: assessmentId },
                attributes: ['department_id'],
            });
            if (!assessment) {
                return res.status(404).json({ success: false, message: 'Assessment not found.' });
            }

            const departmentIdFromAssessment = assessment.department_id;

            const user = await User.findOne({
                where: { user_id: userId, department_id: departmentIdFromAssessment },
                attributes: ['user_id'],
            });

            if (!user) {
                return res.status(403).json({ success: false, message: 'Unauthorized: You do not belong to this department. Only users who created or added the comments can access this resource.' });
            }

            return next();
        } catch (error) {
            console.error('Error during authorization:', error);
            return res.status(500).json({ success: false, message: 'Internal server error during authorization.' });
        }
    };
};
