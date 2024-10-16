import { Company, User } from '../../models/index.js';

export const authorizeCompany = (allowedRoles = []) => {
  return async (req, res, next) => {
    const userRoleId = req.user.role_id;
    const userId = req.user.user_id;
    const { companyId } = req.params;

    if (allowedRoles.length && !allowedRoles.includes(userRoleId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Insufficient permissions.' });
    }

    try {
      if (userRoleId === '1') {
        return next(); 
      }

      if (!companyId) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Only superadmins can view all companies.' });
      }

      const user = await User.findOne({
        where: { user_id: userId, company_id: companyId },
        attributes: ['user_id'] 
      });

      if (!user) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You do not belong to this company.' });
      }

      return next();
    } catch (error) {
      console.error('Error during authorization:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during authorization.' });
    }
  };
};
