import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Department = sequelize.define('Department', {
  departmentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'department_id', 
  },
  departmentName: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'department_name', 
  },
  companyId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'companies',
      key: 'company_id',
    },
    onDelete: 'CASCADE',
    field: 'company_id', 
  },
  masterDepartmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'master_departments',
      key: 'department_id',
    },
    field: 'master_department_id', 
  },
  createdBy: {
    type: DataTypes.STRING(12), // Assuming user_id is a STRING(12)
    references: {
      model: 'users',
      key: 'user_id',
    },
    allowNull: true,
    field: 'created_by', 
  },
}, {
  tableName: 'departments',
  timestamps: false,
});

export default Department;
