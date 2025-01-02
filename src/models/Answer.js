import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Answer = sequelize.define('Answer', {
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
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
  },
  answerText: {
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'answers',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

Answer.associate = (models) => {
  // AssessmentQuestion association
  Answer.belongsTo(models.AssessmentQuestion, { 
    foreignKey: 'assessmentQuestionId', 
    targetKey: 'id', 
    as: 'assessmentQuestion' 
  });
  
  // User association
  Answer.belongsTo(models.User, { 
    foreignKey: 'createdByUserId', 
    targetKey: 'id', 
    as: 'creator' 
  });
  
  // EvidenceFile association
  Answer.hasMany(models.EvidenceFile, { 
    foreignKey: 'answerId', 
    as: 'evidenceFiles' 
  });
};

export default Answer;
