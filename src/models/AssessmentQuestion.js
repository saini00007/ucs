import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AssessmentQuestion = sequelize.define('AssessmentQuestion', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  assessmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'assessments',
      key: 'id',
    },
    onDelete: 'CASCADE',
    allowNull: false,
  },
  masterQuestionId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_questions',
      key: 'id',
    },
    allowNull: false,
  }
}, {
  tableName: 'assessment_questions',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

AssessmentQuestion.associate = (models) => {
  // Assessment association
  AssessmentQuestion.belongsTo(models.Assessment, { 
    foreignKey: 'assessmentId', 
    targetKey: 'id', 
    as: 'assessment' 
  });
  
  // MasterQuestion association
  AssessmentQuestion.belongsTo(models.MasterQuestion, { 
    foreignKey: 'masterQuestionId', 
    targetKey: 'id', 
    as: 'masterQuestion' 
  });
  
  // Answer association
  AssessmentQuestion.hasOne(models.Answer, { 
    foreignKey: 'assessmentQuestionId', 
    as: 'answer' 
  });
  
  // Comment association
  AssessmentQuestion.hasMany(models.Comment, { 
    foreignKey: 'assessmentQuestionId', 
    as: 'comments' 
  });
};

export default AssessmentQuestion;
