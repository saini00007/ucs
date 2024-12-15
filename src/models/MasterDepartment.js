import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterDepartment = sequelize.define('MasterDepartment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  departmentName: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'master_departments',
  timestamps: true,
  underscored: true,
});

export default MasterDepartment;
