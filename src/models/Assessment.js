import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Assessment = sequelize.define('Assessment', {
  assessmentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'assessment_id', 
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
  departmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'departments',
      key: 'department_id',
    },
    onDelete: 'CASCADE',
    field: 'department_id', 
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at', 
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at', 
  },
  assessmentStarted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'assessment_started', 
  },
}, {
  tableName: 'assessments',
  timestamps: false,
});

export default Assessment;
