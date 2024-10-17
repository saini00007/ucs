import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AssessmentQuestion = sequelize.define('AssessmentQuestion', {
  assessmentQuestionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'assessment_question_id', 
  },
  assessmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'assessments',
      key: 'assessment_id',
    },
    onDelete: 'CASCADE',
    field: 'assessment_id', 
  },
  questionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'master_questions',
      key: 'question_id',
    },
    field: 'question_id', 
  },
}, {
  tableName: 'assessment_questions',
  timestamps: false,
});

export default AssessmentQuestion;
