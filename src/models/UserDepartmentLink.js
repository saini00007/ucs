import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserDepartmentLink = sequelize.define('UserDepartmentLink', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.STRING(12),
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'departments',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'user_departments',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

export default UserDepartmentLink;
