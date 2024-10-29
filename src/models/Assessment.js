import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id', 
  },
  companyId: {
    type: DataTypes.UUID,
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'company_id', 
  },
  departmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'departments',
      key: 'id',
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
  underscored: true,
});

export default Assessment;
