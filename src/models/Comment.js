import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Comment = sequelize.define('Comment', {
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
  commentText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'comment_text',
    get() {
      const deletedAt = this.getDataValue('deletedAt');
      if (this.deleted || deletedAt) {
        return null;
      }
      return this.getDataValue('commentText');
    }
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'deleted',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  },
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true,
});

export default Comment;
