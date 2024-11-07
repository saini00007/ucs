import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id',
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
  assessmentName: {
    type: DataTypes.STRING,
    defaultValue: 'default',
    field: 'assessment_name',
  },
  assessmentStarted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'assessment_started',
  },
}, {
  tableName: 'assessments',
  timestamps: true,
  underscored: true,
});

export default Assessment;
