import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterDepartment = sequelize.define('MasterDepartment', {
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  department_name: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'master_departments',
  timestamps: false,
});

export default MasterDepartment;
