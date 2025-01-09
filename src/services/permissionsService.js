import { RoleResourceActionLink } from "../models/index.js";
import {
  checkAssessmentAccess,
  checkDepartmentAccess,
  checkCompanyAccess,
  checkAssessmentQuestionAccess,
  checkAnswerAccess,
  checkEvidenceFileAccess,
  checkCommentAccess,
  checkUserAccess,
  checkSubAssessmentAccess,
  checkSubDepartmentAccess
} from "./contextChecks/index.js";
import AppError from "../utils/AppError.js";
import { CONTENT_RESOURCE_TYPES } from "../utils/constants.js";

// Mapping of resource types to their corresponding access check functions.
const resourceAccessCheckMap = {
  [CONTENT_RESOURCE_TYPES.ASSESSMENT]: checkAssessmentAccess,
  [CONTENT_RESOURCE_TYPES.DEPARTMENT]: checkDepartmentAccess,
  [CONTENT_RESOURCE_TYPES.COMPANY]: checkCompanyAccess,
  [CONTENT_RESOURCE_TYPES.ASSESSMENT_QUESTION]: checkAssessmentQuestionAccess,
  [CONTENT_RESOURCE_TYPES.ANSWER]: checkAnswerAccess,
  [CONTENT_RESOURCE_TYPES.EVIDENCE_FILE]: checkEvidenceFileAccess,
  [CONTENT_RESOURCE_TYPES.COMMENT]: checkCommentAccess,
  [CONTENT_RESOURCE_TYPES.USER]: checkUserAccess,
  [CONTENT_RESOURCE_TYPES.SUB_ASSESSMENT]:checkSubAssessmentAccess,
  [CONTENT_RESOURCE_TYPES.SUB_DEPARTMENT]:checkSubDepartmentAccess
};

const permissionsService = {
  // Method to check if a user has a specific role permission.
  async hasRolePermission({ user, resourceId, actionId }) {
    try {
      // Find a matching permission in the RoleResourceActionLink table.
      console.log(resourceId);
      const permission = await RoleResourceActionLink.findOne({
        where: {
          roleId: user.roleId,
          resourceId: resourceId,
          actionId: actionId,
        },
      });
      if (!permission) {
        // If no permission is found, throw an error
        throw new AppError('Permission not found for the user on the specified resource', 404);
      }

      return { success: true };
    } catch (error) {
      console.log(error)
      throw error;
    }
  },

  // Method to check if a user has access to specific content.
  async hasContentAccess({ user, resourceType, resourceId, actionId }) {
    // Retrieve the access check function for the given resource type.
    const contentAccessCheckFn = resourceAccessCheckMap[resourceType];

    if (!contentAccessCheckFn) {
      // If no matching check function exists for the resource type, throw an error
      throw new AppError('Resource type access check function not found', 400);
    }

    try {
      // Call the access check function and return its result
      const result = await contentAccessCheckFn(user, resourceId, actionId);

      if (!result.success) {
        // If the result indicates no access, throw an error
        throw new AppError('Access denied', 403);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
};

export default permissionsService;
