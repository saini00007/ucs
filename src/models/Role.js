import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Role = sequelize.define('Role', {
  roleId: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'role_id',
  },
  roleName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'role_name',
  },
}, {
  tableName: 'roles',
  timestamps: false,
  hooks: {
    beforeValidate: (role, options) => {
      const namePart = role.roleName.replace(/_/g, '').toLowerCase();
      role.roleId = `role_${namePart}_${Date.now()}`;
    },
  },
});

export default Role;
