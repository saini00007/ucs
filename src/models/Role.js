import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Role = sequelize.define('Role', {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_name: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'roles',
  timestamps: false,
});

export default Role;
