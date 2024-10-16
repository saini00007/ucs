export const authorize = (allowedRoles) => {
    return (req, res, next) => {
      const { role_id } = req.user; 
  
      if (!allowedRoles.includes(role_id)) {
        return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to perform this action.' });
      }
  
      next();
    };
  };
  