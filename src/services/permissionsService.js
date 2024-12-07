import { RoleResourceActionLink } from "../models/index.js";
import {
  checkAssessmentAccess,
  checkDepartmentAccess,
  checkCompanyAccess,
  checkAssessmentQuestionAccess,
  checkAnswerAccess,
  checkEvidenceFileAccess,
  checkCommentAccess,
  checkUserAccess
} from "../middleware/contextChecks/index.js";

// Mapping of resource types to their corresponding access check functions.
const resourceAccessCheckMap = {
  Assessment: checkAssessmentAccess,
  Department: checkDepartmentAccess,
  Company: checkCompanyAccess,
  AssessmentQuestion: checkAssessmentQuestionAccess,
  Answer: checkAnswerAccess,
  EvidenceFile: checkEvidenceFileAccess,
  Comment: checkCommentAccess,
  User: checkUserAccess
};

const permissionsService = {
  // Method to check if a user has a specific role permission.
  async hasRolePermission({ user, resourceId, actionId }) {
    try {
      // Find a matching permission in the RoleResourceActionLink table.
      const permission = await RoleResourceActionLink.findOne({
        where: {
          roleId: user.roleId,
          resourceId: resourceId,
          actionId: actionId,
        },
      });
      return !!permission;
    } catch (error) {
      console.error(`Error checking role permission for user ${user.id} on resource ${resourceId}:`, error);
      return false;
    }
  },

  // Method to check if a user has access to specific content.
  async hasContentAccess({ user, resourceType, resourceId, actionId }) {
    // Retrieve the access check function for the given resource type.
    const contentAccessCheckFn = resourceAccessCheckMap[resourceType];
    if (!contentAccessCheckFn) {
      console.log('Content access check function not found for resource type:', resourceType);
      return false;
    }
    try {
      // Call the access check function and return its result.
      return await contentAccessCheckFn(user, resourceId, actionId);
    } catch (error) {
      console.error(`Error checking content access for user ${user.id} on ${resourceType} ${resourceId}:`, error);
      return false;
    }
  },
};

export default permissionsService;
