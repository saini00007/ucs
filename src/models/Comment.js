import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Comment = sequelize.define('Comment', {
  commentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'comment_id', 
  },
  assessmentQuestionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'assessment_questions',
      key: 'assessment_question_id',
    },
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
  commentText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'comment_text', 
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at', 
  },
}, {
  tableName: 'comments',
  timestamps: false,
});

export default Comment;
