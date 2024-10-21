import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id',
  },
  assessmentQuestionId: {
    type: DataTypes.UUID,
    references: {
      model: 'assessment_questions',
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'assessment_question_id',
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'created_by_user_id',
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
