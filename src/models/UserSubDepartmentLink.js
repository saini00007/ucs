import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserSubDepartmentLink = sequelize.define('UserSubDepartmentLink', {
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
  subDepartmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sub_departments',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'user_sub_departments',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

export default UserSubDepartmentLink;
