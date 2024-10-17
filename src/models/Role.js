import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Role = sequelize.define('Role', {
  roleId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'role_id', 
  },
  roleName: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    field: 'role_name', 
  },
}, {
  tableName: 'roles',
  timestamps: false,
});

export default Role;
