import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const QuestionDepartmentLink = sequelize.define('QuestionDepartmentLink', {
  masterQuestionId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_questions',
      key: 'id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
  },
  masterDepartmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_departments',
      key: 'id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'question_department_links',
  timestamps: true,
  underscored: true,
});

export default QuestionDepartmentLink;
