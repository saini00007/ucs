import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Assessment = sequelize.define('Assessment', {
  assessment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  company_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'companies',
      key: 'company_id',
    },
    onDelete: 'CASCADE',
  },
  department_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'departments',
      key: 'department_id',
    },
    onDelete: 'CASCADE',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  assessment_started: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'assessments',
  timestamps: false,
});

export default Assessment;
