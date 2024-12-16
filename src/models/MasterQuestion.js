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
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  riskLikelihoodScore: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  riskLikelihoodValue: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
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
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  reputationalImpactRating: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  legalImpactRating: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  complianceImpactRating: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  objAndProdOperImpactRating: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  riskImpactValue: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  riskImpactRating: {
    type: DataTypes.TEXT,
  },
  inherentRisk: {
    type: DataTypes.TEXT,
  },
  currentRiskValue: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
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
    type: DataTypes.FLOAT, // Now accepts both integers and float values
  },
  revRiskImpactRating: {
    type: DataTypes.FLOAT, // Now accepts both integers and float values
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
