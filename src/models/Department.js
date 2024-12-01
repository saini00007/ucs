import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id',
  },
  departmentName: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'department_name',
  },
  companyId: {
    type: DataTypes.UUID,
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'company_id',
    allowNull: false,
  },
  masterDepartmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_departments',
      key: 'id',
    },
    allowNull: false,
    field: 'master_department_id',
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
    field: 'created_by_user_id',
  },
}, {
  tableName: 'departments',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

export default Department;
