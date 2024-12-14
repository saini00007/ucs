import { RoleResourceActionLink } from "../models/index.js";
import sequelize from "../config/db.js";

const seedRoleResourceActionLinks = async () => {
  const roleActions = [
    {
      roleId: 'superadmin', resourceActions: [
        { resourceId: 'company', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'department', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'assessment', actionIds: ['start', 'submit', 'read', 'reopen', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read',] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update', 'remove'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'masterdepartment', actionIds: ['list'] },
        { resourceId: 'masterquestion', actionIds: ['list'] },
        { resourceId: 'role', actionIds: ['list'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'report', actionIds: ['read'] }
      ]
    },
    {
      roleId: 'admin',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['list', 'read'] },
        { resourceId: 'assessment', actionIds: ['start', 'submit', 'read', 'reopen', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'role', actionIds: ['list'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'report', actionIds: ['read'] }
      ]
    },
    {
      roleId: 'departmentmanager',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['read'] },
        { resourceId: 'assessment', actionIds: ['start', 'read', 'submit', 'reopen', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
        { resourceId: 'role', actionIds: ['list'] },
      ]
    },
    {
      roleId: 'assessor',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['read'] },
        { resourceId: 'assessment', actionIds: ['start', 'read', 'list', 'submit'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
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
        { resourceId: 'department', actionIds: ['read'] },
        { resourceId: 'assessment', actionIds: ['read', 'list'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
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
