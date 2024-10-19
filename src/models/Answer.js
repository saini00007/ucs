import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Answer = sequelize.define('Answer', {
  answerId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'answer_id',
  },
  assessmentQuestionId: {
    type: DataTypes.UUID,
    references: {
      model: 'assessment_questions',
      key: 'assessment_question_id',
    },
    onDelete: 'CASCADE',
    field: 'assessment_question_id',
  },
  userId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
    field: 'user_id',
  },
  answerText: {
    type: DataTypes.TEXT,
    field: 'answer_text',
  },
}, {
  tableName: 'answers',
  timestamps: false,
});

export default Answer;
