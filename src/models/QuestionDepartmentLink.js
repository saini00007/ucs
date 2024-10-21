// models/QuestionDepartmentLink.js
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class QuestionDepartmentLink extends Model {}

QuestionDepartmentLink.init({
  masterQuestionId: {//
    type: DataTypes.UUID,
    references: {
      model: 'master_questions',
      key: 'id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'master_question_id', 
  },
  masterDepartmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_departments',
      key: 'id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'master_department_id', 
  },
}, {
  sequelize,
  modelName: 'QuestionDepartmentLink',
  tableName: 'question_department_links', 
  timestamps: false, 
});

export default QuestionDepartmentLink;
