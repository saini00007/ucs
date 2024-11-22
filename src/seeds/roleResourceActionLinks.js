import { RoleResourceActionLink } from "../models/index.js";

const seedRoleResourceActionLinks = async () => {
  const roleActions = [
    {
      roleId: 'superadmin', resourceActions: [
        { resourceId: 'company', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'department', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'assessment', actionIds: ['start', 'submit', 'read'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read', 'create', 'remove'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update', 'remove'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'masterdepartment', actionIds: ['list'] },
        { resourceId: 'masterquestion', actionIds: ['list'] },
        { resourceId: 'role', actionIds: ['list'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
      ]
    },
    {
      roleId: 'admin',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['list', 'read'] },
        { resourceId: 'assessment', actionIds: ['start', 'submit', 'read'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'role', actionIds: ['list'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
      ]
    },
    {
      roleId: 'departmentmanager',
      resourceActions: [
        { resourceId: 'company', actionIds: ['read'] },
        { resourceId: 'department', actionIds: ['read'] },
        { resourceId: 'assessment', actionIds: ['start', 'read'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read', 'create', 'update'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'user', actionIds: ['list', 'read', 'create', 'update', 'remove'] },
        { resourceId: 'userdepartmentlink', actionIds: ['create', 'remove'] },
      ]
    },
    {
      roleId: 'assessor',
      resourceActions: [
        { resourceId: 'department', actionIds: ['read'] },
        { resourceId: 'assessment', actionIds: ['start', 'read'] },
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
        { resourceId: 'assessment', actionIds: ['read'] },
        { resourceId: 'assessmentquestion', actionIds: ['list', 'read'] },
        { resourceId: 'answer', actionIds: ['read'] },
        { resourceId: 'evidencefile', actionIds: ['read'] },
        { resourceId: 'comment', actionIds: ['list', 'read'] },
        { resourceId: 'user', actionIds: ['list', 'read'] },
      ]
    },
  ];

  for (const role of roleActions) {
    const { roleId, resourceActions } = role;

    for (const { resourceId, actionIds } of resourceActions) {
      for (const actionId of actionIds) {
        const existingLink = await RoleResourceActionLink.findOne({
          where: { roleId, resourceId, actionId }
        });

        if (!existingLink) {
          await RoleResourceActionLink.create({ roleId, resourceId, actionId });
          console.log(`Role-resource-action link for role ${roleId}, resource ${resourceId}, action ${actionId} inserted.`);
        } else {
          console.log(`Role-resource-action link for role ${roleId}, resource ${resourceId}, action ${actionId} already exists.`);
        }
      }
    }
  }
};

export default seedRoleResourceActionLinks;
