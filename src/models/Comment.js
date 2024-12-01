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
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'assessment_question_id',
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
    field: 'created_by_user_id',
  },
  commentText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'comment_text',
    get() {
      const deletedAt = this.getDataValue('deletedAt');
      if (deletedAt) {
        //mark comment text null while get operations if the comment is deleted
        return null;
      }
      return this.getDataValue('commentText');
    },
  },
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

export default Comment;
