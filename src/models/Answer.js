import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Answer = sequelize.define('Answer', {
  answer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assessment_question_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'assessment_questions',
      key: 'assessment_question_id',
    },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  answer_text: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'answers',
  timestamps: false,
});

export default Answer;
