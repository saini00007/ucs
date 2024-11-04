import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id',
  },
  answerId: {
    type: DataTypes.UUID,
    references: {
      model: 'answers',
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'answer_id',
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'created_by_user_id',
  },
  commentText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'comment_text',
  },
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true,
});


export default Comment;
