import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Comment = sequelize.define('Comment', {
  comment_id: {
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
  },
  user_id: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'comments',
  timestamps: false,
});

export default Comment;
