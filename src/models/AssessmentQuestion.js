import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AssessmentQuestion = sequelize.define('AssessmentQuestion', {
  assessment_question_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assessment_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'assessments',
      key: 'assessment_id',
    },
    onDelete: 'CASCADE',
  },
  question_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'master_questions',
      key: 'question_id',
    },
  },
}, {
  tableName: 'assessment_questions',
  timestamps: false,
});

export default AssessmentQuestion;
