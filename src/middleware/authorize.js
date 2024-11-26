import chalk from 'chalk';
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

    // Log access attempt details
    console.log(chalk.green(`Role ID: ${roleId}, Role Resource Type: ${roleResourceType}, Action: ${actionId}, Content Resource Type: ${contentResourceType}, Content Resource ID: ${contentResourceId}`));

    // Check if the user has the required role permission
    const hasRolePermission = await permissionsService.hasRolePermission({
      user: req.user,
      resourceId: roleResourceId,
      actionId,
    });
    if (!hasRolePermission) {
      // If the user lacks the required role permission, deny access
      return res.status(403).json({
        success: false,
        messages: ['Access denied: insufficient role permissions.']
      });
    }

    // Skip further checks if the user is a superadmin
    if (roleId == 'superadmin') return next();

    // Check if the user has the necessary content access for the specific resource
    const hasContentAccess = await permissionsService.hasContentAccess({
      user: req.user,
      resourceType: contentResourceType,
      resourceId: contentResourceId,
      actionId
    });
    if (!hasContentAccess) {
      // If the user lacks content access, deny access
      return res.status(403).json({
        success: false,
        messages: ['Access denied: insufficient content access.']
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
