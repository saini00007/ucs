// models/QuestionDepartmentLink.js
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class QuestionDepartmentLink extends Model {}

QuestionDepartmentLink.init({
  question_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'master_questions', // This should match the table name
      key: 'question_id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
  },
  master_department_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'master_departments', // This should match the table name
      key: 'department_id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
  },
}, {
  sequelize,
  modelName: 'QuestionDepartmentLink',
  tableName: 'question_department_links', // Ensure the table name matches
  timestamps: false, // Adjust this if you want timestamps
});

// Export the model
export default QuestionDepartmentLink;
