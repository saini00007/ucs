import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AssessmentQuestion = sequelize.define('AssessmentQuestion', {
  assessmentQuestionId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'assessment_question_id', 
  },
  assessmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'assessments',
      key: 'assessment_id',
    },
    onDelete: 'CASCADE',
    field: 'assessment_id', 
  },
  masterQuestionId: {//
    type: DataTypes.UUID,
    references: {
      model: 'master_questions',
      key: 'question_id',
    },
    field: 'master_question_id', 
  },
}, {
  tableName: 'assessment_questions',
  timestamps: false,
});

export default AssessmentQuestion;
