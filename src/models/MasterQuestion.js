import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterQuestion = sequelize.define('MasterQuestion', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  srno: {
    type: DataTypes.INTEGER,
  },
  sp80053ControlNum: {
    type: DataTypes.TEXT,
    field: 'sp_800_53_control_number',
  },
  controlName: {
    type: DataTypes.TEXT,
  },
  questionText: {
    type: DataTypes.TEXT,
  },
  department: {
    type: DataTypes.TEXT,
  },
  masterDepartmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_departments',
      key: 'id'
    },
    allowNull: false,
  },
  masterSubDepartmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_sub_departments',
      key: 'id'
    },
    allowNull: false,
  }
}, {
  tableName: 'master_questions',
  timestamps: true,
  underscored: true,
});

MasterQuestion.associate = (models) => {
  MasterQuestion.hasMany(models.AssessmentQuestion, {
    foreignKey: 'masterQuestionId',
    as: 'assessmentQuestions'
  });

  MasterQuestion.belongsToMany(models.MasterDepartment, {
    through: models.QuestionDepartmentLink,
    foreignKey: 'masterQuestionId',
    otherKey: 'masterDepartmentId',
    as: 'masterDepartments'
  });

  MasterQuestion.hasOne(models.RiskVulnerabilityAssessment, {
    foreignKey: 'masterQuestionId',
    as: 'riskVulnerabilityAssessment'
  });

  MasterQuestion.hasOne(models.ISO27001Control, {
    foreignKey: 'masterQuestionId',
    as: 'iso27001Control'
  });

  MasterQuestion.hasOne(models.NISTCSFControl, {
    foreignKey: 'masterQuestionId',
    as: 'nistCsfControl'
  });

  MasterQuestion.hasOne(models.MITREControl, {
    foreignKey: 'masterQuestionId',
    as: 'mitreControl'
  });

  MasterQuestion.hasOne(models.NIST80082Control, {
    foreignKey: 'masterQuestionId',
    as: 'nist80082Control'
  });

  MasterQuestion.hasOne(models.IEC62443Control, {
    foreignKey: 'masterQuestionId',
    as: 'iec62443Control'
  });

  MasterQuestion.hasOne(models.PCIDSSControl, {
    foreignKey: 'masterQuestionId',
    as: 'pcidssControl'
  });

  MasterQuestion.belongsTo(models.MasterDepartment, {
    foreignKey: 'masterDepartmentId',
    targetKey: 'id',
    as: 'masterDepartment'
  });

  MasterQuestion.belongsTo(models.MasterSubDepartment, {
    foreignKey: 'masterSubDepartmentId',
    targetKey: 'id',
    as: 'masterSubDepartment'
  });
};

export default MasterQuestion