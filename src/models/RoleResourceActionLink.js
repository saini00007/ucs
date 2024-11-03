import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const RoleResourceActionLink = sequelize.define('RoleResourceActionLink', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  },
  roleId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'roles', 
      key: 'id',
    },
    field: 'role_id',
  },
  resourceId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'resources', 
      key: 'id',
    },
    field: 'resource_id',
  },
  actionId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'actions',
      key: 'id',
    },
    field: 'action_id',
  },
}, {
  tableName: 'role_resource_actions',
  timestamps: false,
});

export default RoleResourceActionLink;
