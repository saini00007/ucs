import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AssessmentQuestion = sequelize.define('AssessmentQuestion', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id', 
  },
  assessmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'assessments',
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'assessment_id', 
  },
  masterQuestionId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_questions',
      key: 'id',
    },
    field: 'master_question_id', 
  },
}, {
  tableName: 'assessment_questions',
  timestamps: false,
  underscored: true,
});

export default AssessmentQuestion;
