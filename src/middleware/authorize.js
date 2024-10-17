export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const { roleId } = req.user; // Updated to camelCase

    if (!allowedRoles.includes(roleId)) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to perform this action.' });
    }

    next();
  };
};
