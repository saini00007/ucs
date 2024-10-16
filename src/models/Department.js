import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Department = sequelize.define('Department', {
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  department_name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  company_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'companies',
      key: 'company_id',
    },
    onDelete: 'CASCADE',
  },
  master_department_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'master_departments',
      key: 'department_id',
    },
  },
  created_by: {
    type: DataTypes.STRING(12), // Assuming user_id is a STRING(12)
    references: {
      model: 'users', // Reference to the users table
      key: 'user_id',
    },
    allowNull: true, // Set to false if a creator is mandatory
  },
}, {
  tableName: 'departments',
  timestamps: false,
});

export default Department;
