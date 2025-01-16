import { RoleResourceActionLink } from "../models/index.js";
import sequelize from "../config/db.js";

const seedRoleResourceActionLinks = async () => {
  const roleActions = [
    {
      roleId: 'superadmin', resourceActions: [
        { resourceId: 'company', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'department', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'subdepartment', actionIds: ['list', 'read'] },
        { resourceId: 'assessment', actionIds: ['start', 'submit', 'read', 'reopen', 'list'] },
        { resourceId: 'subassessment', actionIds: ['read', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read',] },
        { resourceId: 'subassessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update', 'remove'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'masterdepartment', actionIds: ['list'] },
        { resourceId: 'masterquestion', actionIds: ['list'] },
        { resourceId: 'role', actionIds: ['list'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'usersubdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'report', actionIds: ['read'] },
        { resourceId: 'industrysector', actionIds: ['list'] },
        { resourceId: 'controlframework', actionIds: ['list'] },
        { resourceId: 'companyprogressreport', actionIds: ['read'] },
      ]
    },
    {
      roleId: 'admin',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'subdepartment', actionIds: ['list', 'read'] },
        { resourceId: 'assessment', actionIds: ['start', 'submit', 'read', 'reopen', 'list'] },
        { resourceId: 'subassessment', actionIds: ['read', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'subassessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'role', actionIds: ['list'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'usersubdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'report', actionIds: ['read'] },
        { resourceId: 'companyprogressreport', actionIds: ['read'] },
      ]
    },
    {
      roleId: 'leadership',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['list', 'read'] },
        { resourceId: 'subdepartment', actionIds: ['list', 'read'] },
        { resourceId: 'assessment', actionIds: ['start', 'submit', 'read', 'reopen', 'list'] },
        { resourceId: 'subassessment', actionIds: ['read', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'subassessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'role', actionIds: ['list'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'usersubdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'report', actionIds: ['read'] },
        { resourceId: 'companyprogressreport', actionIds: ['read'] },
      ]
    },
    {
      roleId: 'departmentmanager',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['read', 'list'] },
        { resourceId: 'subdepartment', actionIds: ['read', 'list'] },
        { resourceId: 'assessment', actionIds: ['start', 'read', 'submit', 'reopen', 'list'] },
        { resourceId: 'subassessment', actionIds: ['read', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'subassessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'usersubdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'role', actionIds: ['list'] },
      ]
    },
    {
      roleId: 'assessor',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['read', 'list'] },
        { resourceId: 'subdepartment', actionIds: ['read', 'list'] },
        { resourceId: 'assessment', actionIds: ['start', 'read', 'list', 'submit'] },
        { resourceId: 'subassessment', actionIds: ['read', 'list'] },
        { resourceId: 'assessment', actionIds: ['start', 'read', 'list', 'submit'] },
        { resourceId: 'subassessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read'] },
      ]
    },
    {
      roleId: 'reviewer',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['read', 'list'] },
        { resourceId: 'subdepartment', actionIds: ['read', 'list'] },
        { resourceId: 'assessment', actionIds: ['read', 'list'] },
        { resourceId: 'subassessment', actionIds: ['read', 'list'] },
        { resourceId: 'subassessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read'] },
      ]
    },
  ];

  const transaction = await sequelize.transaction();
  try {
    for (const role of roleActions) {
      const { roleId, resourceActions } = role;

      for (const { resourceId, actionIds } of resourceActions) {
        for (const actionId of actionIds) {
          const existingLink = await RoleResourceActionLink.findOne({
            where: { roleId, resourceId, actionId },
            transaction
          });

          if (!existingLink) {
            await RoleResourceActionLink.create({ roleId, resourceId, actionId }, { transaction });
            console.log(`Role-resource-action link for role ${roleId}, resource ${resourceId}, action ${actionId} inserted.`);
          } else {
            console.log(`Role-resource-action link for role ${roleId}, resource ${resourceId}, action ${actionId} already exists.`);
          }
        }
      }
    }
    await transaction.commit();
  } catch (error) {
    console.error('Error seeding role-resource-action links:', error);
    await transaction.rollback();
  }
};

export default seedRoleResourceActionLinks;
