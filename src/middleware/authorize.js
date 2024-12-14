import permissionsService from '../services/permissionsService.js';
import { getResourceId, getActionId } from '../utils/resourceActionUtils.js'

const checkAccess = async (req, res, next) => {
  const { roleId } = req.user;
  const roleResourceType = req.roleResourceType;
  const contentResourceType = req.contentResourceType;
  const contentResourceId = req.contentResourceId;
  const actionId = req.actionId;

  try {

    const roleResourceId = roleResourceType.toLowerCase();
    console.log(`User Id: ${req.user.id}, Role ID: ${roleId}, Role Resource Type: ${roleResourceType}, Action: ${actionId}, Content Resource Type: ${contentResourceType}, Content Resource ID: ${contentResourceId}`);

    // Check if the user has the required role permission
    const hasRolePermission = await permissionsService.hasRolePermission({
      user: req.user,
      resourceId: roleResourceId,
      actionId,
    });

    if (!hasRolePermission.success) {
      // If the user lacks the required role permission, deny access
      return res.status(403).json({
        success: false,
        messages: ['Access denied: insufficient role permissions.']
      });
    }

    // role-based access check is enough for these resources 
    if (contentResourceType === null) {
      return next();
    }

    // Check if the user has the necessary content access for the specific resource
    const hasContentAccess = await permissionsService.hasContentAccess({
      user: req.user,
      resourceType: contentResourceType,
      resourceId: contentResourceId,
      actionId
    });

    if (!hasContentAccess.success) {
      // For superadmins, return the received message and status
      if (req.user.roleId === 'superadmin') {
        return res.status(hasContentAccess.status || 403).json({
          success: false,
          messages: [hasContentAccess.message || 'Access denied: insufficient content permissions.']
        });
      }

      // For non-superadmins, show a generic message for status 500 or a default 403 message
      return res.status(hasContentAccess.status === 500 ? 500 : 403).json({
        success: false,
        messages: [
          hasContentAccess.status === 500
            ? (hasContentAccess.message || 'Internal Server Error')
            : 'Access denied: insufficient content permissions.'
        ],
      });
    }
    return next();
  } catch (error) {
    // Handle any errors that occur during the access check process
    console.error('Error checking access:', error);
    return res.status(500).json({
      success: false,
      messages: ['Internal Server Error: An unexpected error occurred.'],
    });
  }
};

export default checkAccess;
