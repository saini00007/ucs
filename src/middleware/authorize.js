import permissionsService from '../services/permissionsService.js';
import AppError from '../utils/AppError.js';
import { resourceTypeToId, ROLE_IDS } from '../utils/constants.js';

const checkAccess = async (req, res, next) => {
  const { roleId } = req.user;
  const roleResourceType = req.roleResourceType;
  const contentResourceType = req.contentResourceType;
  const contentResourceId = req.contentResourceId;
  const actionId = req.actionId;

  try {
    const roleResourceId = resourceTypeToId[roleResourceType];

    console.log(`User Id: ${req.user.id}, Role ID: ${roleId}, Role Resource Type: ${roleResourceType}, Action: ${actionId}, Content Resource Type: ${contentResourceType}, Content Resource ID: ${contentResourceId}`);
    // Check if the user has the required role permission

    const rolePermission = await permissionsService.hasRolePermission({
      user: req.user,
      resourceId: roleResourceId,
      actionId,
    });
    

    // Explicitly check if the role permission was successful
    if (!rolePermission.success) {
      throw new AppError('Access denied: insufficient permissions.', 403);
    }

    // If content resource type is null, the role-based access check suffices
    if (!contentResourceType) {
      return next();
    }

    // Check if the user has the necessary content access for the specific resource
    const contentAccess = await permissionsService.hasContentAccess({
      user: req.user,
      resourceType: contentResourceType,
      resourceId: contentResourceId,
      actionId
    });

    // Explicitly check if the attribute based check was successful
    if (!contentAccess.success) {
      throw new AppError('Access denied: insufficient permissions.', 403);
    }

    return next();
  } catch (error) {
    // For superadmins, propagate the error with its message and status
    console.log(error)
    if (req.user.roleId === ROLE_IDS.SUPER_ADMIN) {
      return next(error);
    }

    // For non-superadmin users, provide a generic access denied message
    // If it's a server error (500), we use 'Internal Server Error' for clarity
    const errorMessage = error.status === 500
      ? 'Internal Server Error'
      : 'Access denied: insufficient permissions.';

    return next(new AppError(errorMessage, error.status === 500 ? 500 : 403));
  }
};

export default checkAccess;
