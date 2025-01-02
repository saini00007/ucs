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
    field: 'srno',
  },
  sp80053ControlNum: {
    type: DataTypes.TEXT,
    field: 'sp_800_53_control_number',
  },
  controlName: {
    type: DataTypes.TEXT,
  },
  iso270012022CIdNum: {
    type: DataTypes.TEXT,
    field: 'iso_27001_2022_control_id_number',
  },
  nistCsfControlId: {
    type: DataTypes.TEXT,
  },
  mitreDefendControlId: {
    type: DataTypes.TEXT,
  },
  nist80082ControlId: {
    type: DataTypes.TEXT,
    field: 'nist_800_82_control_id',
  },
  iec62443ControlId: {
    type: DataTypes.TEXT,
    field: 'iec_62443_control_id',
  },
  pcidss: {
    type: DataTypes.TEXT,
  },
  questionText: {
    type: DataTypes.TEXT,
  },
  vulnerabilityDesc: {
    type: DataTypes.TEXT,
  },
  vulnerabilityRating: {
    type: DataTypes.TEXT,
  },
  vulnerabilityValue: {
    type: DataTypes.FLOAT,
  },
  riskLikelihoodScore: {
    type: DataTypes.FLOAT,
  },
  riskLikelihoodValue: {
    type: DataTypes.FLOAT,
  },
  riskLikelihoodRating: {
    type: DataTypes.TEXT,
  },
  ermLikelihoodRating: {
    type: DataTypes.TEXT,
  },
  operationalImpactDesc: {
    type: DataTypes.TEXT,
  },
  businessImpactDesc: {
    type: DataTypes.TEXT,
  },
  financialImpactRating: {
    type: DataTypes.FLOAT,
  },
  reputationalImpactRating: {
    type: DataTypes.FLOAT,
  },
  legalImpactRating: {
    type: DataTypes.FLOAT,
  },
  complianceImpactRating: {
    type: DataTypes.FLOAT,
  },
  objAndProdOperImpactRating: {
    type: DataTypes.FLOAT,
  },
  riskImpactValue: {
    type: DataTypes.FLOAT,
  },
  riskImpactRating: {
    type: DataTypes.TEXT,
  },
  inherentRisk: {
    type: DataTypes.TEXT,
  },
  currentRiskValue: {
    type: DataTypes.FLOAT,
  },
  currentRiskRating: {
    type: DataTypes.TEXT,
  },
  ermRiskRating: {
    type: DataTypes.TEXT,
  },
  riskOwner: {
    type: DataTypes.TEXT,
  },
  riskTreatmentPlan1: {
    type: DataTypes.TEXT,
  },
  riskTreatmentPlan2: {
    type: DataTypes.TEXT,
  },
  riskTreatmentPlan3: {
    type: DataTypes.TEXT,
  },
  riskTreatmentPlan4: {
    type: DataTypes.TEXT,
  },
  riskTreatmentPlan5: {
    type: DataTypes.TEXT,
  },
  revRiskLikelihoodRating: {
    type: DataTypes.FLOAT,
  },
  revRiskImpactRating: {
    type: DataTypes.FLOAT,
  },
  targetRiskRating: {
    type: DataTypes.TEXT,
  },
  department: {
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'master_questions',
  timestamps: true,
  underscored: true,
  scopes: {
    riskReport: {
      attributes: [
        'srno',
        'sp80053ControlNum',
        'controlName',
        'iso270012022CIdNum',
        'nistCsfControlId',
        'mitreDefendControlId',
        'nist80082ControlId',
        'iec62443ControlId',
        'pcidss',
        'vulnerabilityDesc',
        'vulnerabilityRating',
        'ermLikelihoodRating',
        'operationalImpactDesc',
        'businessImpactDesc',
        'currentRiskRating',
        'ermRiskRating',
        'riskOwner',
        'riskTreatmentPlan1',
        'riskTreatmentPlan2',
        'riskTreatmentPlan3',
        'riskTreatmentPlan4',
        'riskTreatmentPlan5'
      ]
    }
  }
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
};

export default MasterQuestion;