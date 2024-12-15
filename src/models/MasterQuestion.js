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
  sp80053ControlNumber: {
    type: DataTypes.TEXT,
    field: 'sp_800_53_control_number',
  },
  controlName: {
    type: DataTypes.TEXT,
  },
  iso270012022ControlIdNumber: {
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
  vulnerabilityDescription: {
    type: DataTypes.TEXT,
  },
  vulnerabilityRating: {
    type: DataTypes.TEXT,
  },
  vulnerabilityValue: {
    type: DataTypes.INTEGER,
  },
  riskLikelihoodScore: {
    type: DataTypes.INTEGER,
  },
  riskLikelihoodValue: {
    type: DataTypes.INTEGER,
  },
  riskLikelihoodRating: {
    type: DataTypes.TEXT,
  },
  ermLikelihoodRating: {
    type: DataTypes.TEXT,
  },
  operationalImpactDescription: {
    type: DataTypes.TEXT,
  },
  businessImpactDescription: {
    type: DataTypes.TEXT,
  },
  financialImpactRating: {
    type: DataTypes.INTEGER,
  },
  reputationalImpactRating: {
    type: DataTypes.INTEGER,
  },
  legalImpactRating: {
    type: DataTypes.INTEGER,
  },
  complianceImpactRating: {
    type: DataTypes.INTEGER,
  },
  objectivesAndProductionOperationsImpactRating: {
    type: DataTypes.INTEGER,
  },
  riskImpactValue: {
    type: DataTypes.INTEGER,
  },
  riskImpactRating: {
    type: DataTypes.TEXT,
  },
  inherentRisk: {
    type: DataTypes.TEXT,
  },
  currentRiskValue: {
    type: DataTypes.INTEGER,
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
  revisedRiskLikelihoodRating: {
    type: DataTypes.INTEGER,
  },
  revisedRiskImpactRating: {
    type: DataTypes.INTEGER,
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
});

export default MasterQuestion;