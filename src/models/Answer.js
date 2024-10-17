import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Answer = sequelize.define('Answer', {
  answerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'answer_id',
  },
  assessmentQuestionId: {
    type: DataTypes.INTEGER,
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
