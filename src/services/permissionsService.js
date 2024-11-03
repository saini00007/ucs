import { AssessmentQuestion, MasterDepartment, MasterQuestion, RoleResourceActionLink } from "../models/index.js";
import {
  checkAssessmentAccess,
  checkDepartmentAccess,
  checkCompanyAccess,
  checkAssessmentQuestionAccess,
  checkAnswerAccess,
  checkEvidenceFileAccess,
  checkCommentAccess,
  checkMasterQuestionAccess,
  checkMasterDepartmentAccess,
} from "../middleware/contextChecks/index.js";
import { checkRoleAccess } from "../middleware/contextChecks/checkRoleAccess.js";

const resourceAccessCheckMap = {
  Assessment: checkAssessmentAccess,
  Department: checkDepartmentAccess,
  Company: checkCompanyAccess,
  AssessmentQuestion: checkAssessmentQuestionAccess,
  Answer: checkAnswerAccess,
  EvidenceFile: checkEvidenceFileAccess,
  Comment: checkCommentAccess,
  MasterQuestion: checkMasterQuestionAccess,
  MasterDepartment: checkMasterDepartmentAccess,
  Role: checkRoleAccess
};

const permissionsService = {
  async hasRolePermission({ user, resourceIdDb, actionIdDb }) {
    try {
      const permission = await RoleResourceActionLink.findOne({
        where: {
          roleId: user.roleId,
          resourceId: resourceIdDb,
          actionId: actionIdDb,
        },
      });
      return !!permission;
    } catch (error) {
      console.error(`Error checking role permission for user ${user.id} on ${resourceType} ${resourceId}:`, error);
      return false;
    }
  },

  async hasContentAccess({ user, resourceType, resourceId,actionIdDb }) {
    const contentAccessCheckFn = resourceAccessCheckMap[resourceType];
    if (!contentAccessCheckFn) {
      console.log('contentAccessCheckFn not found');
      return false;
    }
    try {
      return await contentAccessCheckFn(user, resourceId,actionIdDb);

    } catch (error) {
      console.error(`Error checking content access for user ${user.id} on ${resourceType} ${resourceId}:`, error);
      return false;
    }
  },
};

export default permissionsService;
