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
} from "./contextChecks/index.js";

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
      return { success: !!permission };
    } catch (error) {
      console.error(`Error checking role permission for user ${user.id} on resource ${resourceId}:`, error);
      return { success: false };
    }
  },

  // Method to check if a user has access to specific content.
  async hasContentAccess({ user, resourceType, resourceId, actionId }) {
    // Retrieve the access check function for the given resource type.
    const contentAccessCheckFn = resourceAccessCheckMap[resourceType];

    if (!contentAccessCheckFn) {
      console.log('Content access check function not found for resource type:', resourceType);
      return { success: false, message: 'Resource type access check function not found', status: 400 };
    }

    try {
      // Call the access check function and return its result.
      const result = await contentAccessCheckFn(user, resourceId, actionId);
      return result;
    } catch (error) {
      console.error(`Error checking content access for user ${user.id} on ${resourceType} ${resourceId}:`, error);
      return { success: false, message: 'Internal server error', status: 500 };
    }
  }

};

export default permissionsService;
