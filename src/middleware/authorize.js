// middlewares/authorize.js

export const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
      const userRoleId = req.user.role_id;
      console.log(userRoleId);

      console.log(allowedRoles);
    console.log(allowedRoles.includes(userRoleId));
      if (allowedRoles.length && !allowedRoles.includes(userRoleId)) {
        return res.status(403).json({ message: 'unauthorized' });
      }
      next();
    };
  };
  