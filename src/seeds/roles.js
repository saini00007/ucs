import Role from '../models/Role';
import Resource from '../models/Resource';
import Action from '../models/Action';
import RoleResourceActionLink from '../models/RoleResourceActionLink';

const roles = [
  { id: 'superadmin', roleName: 'superAdmin' },
  { id: 'admin', roleName: 'admin' },
  { id: 'departmentmanager', roleName: 'departmentManager' },
  { id: 'assessor', roleName: 'assessor' },
  { id: 'reviewer', roleName: 'reviewer' },
  { id: 'reportviewer', roleName: 'reportViewer' },
  { id: 'guestuser', roleName: 'guestUser' },
];

const resources = [
  { id: 'company', resourceName: 'Company' },
  { id: 'department', resourceName: 'Department' },
  { id: 'assessment', resourceName: 'Assessment' },
  { id: 'assessmentquestion', resourceName: 'AssessmentQuestion' },
  { id: 'answer', resourceName: 'Answer' },
  { id: 'user', resourceName: 'User' },
  { id: 'evidencefile', resourceName: 'EvidenceFile' },
  { id: 'comment', resourceName: 'Comment' },
  { id: 'masterquestion', resourceName: 'MasterQuestion' },
  { id: 'masterdepartment', resourceName: 'MasterDepartment' },
  { id: 'role', resourceName: 'Role' }
];

const actions = [
  { id: 'read', actionName: 'read' },
  { id: 'create', actionName: 'create' },
  { id: 'update', actionName: 'update' },
  { id: 'remove', actionName: 'remove' },
  { id: 'list', actionName: 'list' },
  { id: 'start', actionName: 'start' }
];

const createOrFind = async (model, entities) => {
  for (const entity of entities) {
    const [existingEntity, created] = await model.findOrCreate({
      where: { id: entity.id },
      defaults: entity,
    });
    if (created) {
      console.log(`${model.name} ${entity.id} inserted.`);
    } else {
      console.log(`${model.name} ${entity.id} already exists.`);
    }
  }
};

const seedRoles = () => createOrFind(Role, roles);
const seedResources = () => createOrFind(Resource, resources);
const seedActions = () => createOrFind(Action, actions);

const seedRoleResourceActionLinks = async () => {
  const roleResourceActionLinks = [
    { roleId: 'superadmin', resourceId: 'company', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'company', actionId: 'read' },
    { roleId: 'superadmin', resourceId: 'company', actionId: 'create' },
    { roleId: 'superadmin', resourceId: 'company', actionId: 'update' },
    { roleId: 'superadmin', resourceId: 'company', actionId: 'remove' },
    { roleId: 'superadmin', resourceId: 'department', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'department', actionId: 'read' },
    { roleId: 'superadmin', resourceId: 'department', actionId: 'create' },
    { roleId: 'superadmin', resourceId: 'department', actionId: 'update' },
    { roleId: 'superadmin', resourceId: 'department', actionId: 'remove' },
    { roleId: 'superadmin', resourceId: 'user', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'user', actionId: 'read' },
    { roleId: 'superadmin', resourceId: 'user', actionId: 'create' },
    { roleId: 'superadmin', resourceId: 'user', actionId: 'update' },
    { roleId: 'superadmin', resourceId: 'user', actionId: 'remove' },
    { roleId: 'superadmin', resourceId: 'assessment', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'assessment', actionId: 'read' },
    { roleId: 'superadmin', resourceId: 'assessment', actionId: 'create' },
    { roleId: 'superadmin', resourceId: 'assessment', actionId: 'update' },
    { roleId: 'superadmin', resourceId: 'assessment', actionId: 'remove' },
    { roleId: 'superadmin', resourceId: 'assessmentquestion', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'assessmentquestion', actionId: 'read' },
    { roleId: 'superadmin', resourceId: 'assessmentquestion', actionId: 'create' },
    { roleId: 'superadmin', resourceId: 'assessmentquestion', actionId: 'update' },
    { roleId: 'superadmin', resourceId: 'assessmentquestion', actionId: 'remove' },
    { roleId: 'superadmin', resourceId: 'answer', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'answer', actionId: 'read' },
    { roleId: 'superadmin', resourceId: 'answer', actionId: 'create' },
    { roleId: 'superadmin', resourceId: 'answer', actionId: 'update' },
    { roleId: 'superadmin', resourceId: 'answer', actionId: 'remove' },
    { roleId: 'superadmin', resourceId: 'comment', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'comment', actionId: 'read' },
    { roleId: 'superadmin', resourceId: 'comment', actionId: 'create' },
    { roleId: 'superadmin', resourceId: 'comment', actionId: 'update' },
    { roleId: 'superadmin', resourceId: 'comment', actionId: 'remove' },
    { roleId: 'superadmin', resourceId: 'masterquestion', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'masterdepartment', actionId: 'list' },
    { roleId: 'superadmin', resourceId: 'role', actionId: 'list' },
    { roleId: 'admin', resourceId: 'company', actionId: 'read' },
    { roleId: 'admin', resourceId: 'department', actionId: 'list' },
    { roleId: 'admin', resourceId: 'department', actionId: 'read' },
    { roleId: 'admin', resourceId: 'user', actionId: 'list' },
    { roleId: 'admin', resourceId: 'user', actionId: 'read' },
    { roleId: 'admin', resourceId: 'user', actionId: 'create' },
    { roleId: 'admin', resourceId: 'user', actionId: 'update' },
    { roleId: 'admin', resourceId: 'user', actionId: 'remove' },
    { roleId: 'admin', resourceId: 'assessment', actionId: 'start' },
    { roleId: 'admin', resourceId: 'assessment', actionId: 'list' },
    { roleId: 'admin', resourceId: 'assessment', actionId: 'read' },
    { roleId: 'admin', resourceId: 'assessmentquestion', actionId: 'list' },
    { roleId: 'admin', resourceId: 'assessmentquestion', actionId: 'read' },
    { roleId: 'admin', resourceId: 'answer', actionId: 'list' },
    { roleId: 'admin', resourceId: 'answer', actionId: 'read' },
    { roleId: 'admin', resourceId: 'answer', actionId: 'create' },
    { roleId: 'admin', resourceId: 'answer', actionId: 'update' },
    { roleId: 'admin', resourceId: 'comment', actionId: 'list' },
    { roleId: 'admin', resourceId: 'comment', actionId: 'read' },
    { roleId: 'admin', resourceId: 'comment', actionId: 'create' },
    { roleId: 'admin', resourceId: 'comment', actionId: 'update' },
    { roleId: 'admin', resourceId: 'comment', actionId: 'remove' },
    { roleId: 'admin', resourceId: 'role', actionId: 'list' },
    { roleId: 'guestuser', resourceId: 'user', actionId: 'read' },
    { roleId: 'guestuser', resourceId: 'assessment', actionId: 'read' },
    { roleId: 'guestuser', resourceId: 'assessmentquestion', actionId: 'read' },
    { roleId: 'guestuser', resourceId: 'answer', actionId: 'read' },
    { roleId: 'guestuser', resourceId: 'assessment', actionId: 'start' },

  ];

  for (const link of roleResourceActionLinks) {
    const [linkInstance, created] = await RoleResourceActionLink.findOrCreate({
      where: {
        roleId: link.roleId,
        resourceId: link.resourceId,
        actionId: link.actionId,
      },
    });
    if (created) {
      console.log(`Permission granted for ${link.roleId} to ${link.actionId} on ${link.resourceId}.`);
    } else {
      console.log(`Permission already exists for ${link.roleId} to ${link.actionId} on ${link.resourceId}.`);
    }
  }
};

const seedAll = async () => {
  try {
    await seedRoles();
    await seedResources();
    await seedActions();
    await seedRoleResourceActionLinks();
  } catch (error) {
    console.error("Error during seeding:", error);
  }
};

export default seedAll;
