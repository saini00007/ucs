import chalk from 'chalk';
import permissionsService from '../services/permissionsService.js';
import { getResourceId, getActionId } from '../utils/resourceActionUtils.js'

export const checkAccess = async (req, res, next) => {
  const { roleId } = req.user;
  const roleResourceType = req.roleResourceType;
  const contentResourceType = req.contentResourceType;
  const contentResourceId = req.contentResourceId;
  const action = req.action;

  console.log(chalk.green(`Role ID: ${roleId},Role Resource Type: ${roleResourceType}, Action: ${action}, Content Resource Type: ${contentResourceType}, Content Resource ID: ${contentResourceId}`));


  try {
    const resourceIdDb = await getResourceId(roleResourceType);
    const actionIdDb = await getActionId(action);
    const hasRolePermission = await permissionsService.hasRolePermission({
      user: req.user,
      resourceIdDb,
      actionIdDb,
    });
    if (!hasRolePermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient role permissions.'
      });
    }

    const hasContentAccess = await permissionsService.hasContentAccess({
      user: req.user,
      resourceType: contentResourceType,
      resourceId: contentResourceId,
      actionIdDb
    });

    if (!hasContentAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient content access.'
      });
    }

    return next();
  } catch (error) {
    console.error('Error checking access:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error: An unexpected error occurred.',
    });
  }
};
