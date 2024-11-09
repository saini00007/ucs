import chalk from 'chalk';
import permissionsService from '../services/permissionsService.js';
import { getResourceId, getActionId } from '../utils/resourceActionUtils.js'

const checkAccess = async (req, res, next) => {
  const { roleId } = req.user;
  const roleResourceType = req.roleResourceType;
  const contentResourceType = req.contentResourceType;
  const contentResourceId = req.contentResourceId;
  const actionType = req.actionType;


  try {
    const resourceIdDb = await getResourceId(roleResourceType);
    const actionIdDb = await getActionId(actionType);
    console.log(chalk.green(`Role ID: ${roleId},Role Resource Type: ${roleResourceType}, Action: ${actionType}, Content Resource Type: ${contentResourceType}, Content Resource ID: ${contentResourceId}`));

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
    if (roleId == 'superadmin') return next();

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
export default checkAccess;