import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterDepartment = sequelize.define('MasterDepartment', {
  departmentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'department_id', 
  },
  departmentName: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    field: 'department_name', 
  },
}, {
  tableName: 'master_departments',
  timestamps: false,
});

export default MasterDepartment;
