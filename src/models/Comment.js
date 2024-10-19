import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Comment = sequelize.define('Comment', {
  commentId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'comment_id', 
  },
  assessmentQuestionId: {
    type: DataTypes.UUID,
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
