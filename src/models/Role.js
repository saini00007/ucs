import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'id',
  },
  roleName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'role_name',
  },
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true,
});

export default Role;
