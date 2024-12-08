import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterQuestion = sequelize.define('MasterQuestion', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id',
  },
  srNo: {
    type: DataTypes.INTEGER,
    field: 'srno',
  },
  sp80053ControlNumber: {
    type: DataTypes.TEXT,
    field: 'sp_800_53_control_number',
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'question_text',
  },
  vulnerabilityDescription: {
    type: DataTypes.TEXT,
    field: 'vulnerability_description',
  },
  vulnerabilityRating: {
    type: DataTypes.TEXT,
    field: 'vulnerability_rating', 
  },
  vulnerabilityValue: {
    type: DataTypes.INTEGER,
    field: 'vulnerability_value',
  },
  riskLikelihoodScore: {
    type: DataTypes.INTEGER,
    field: 'risk_likelihood_score',
  },
  riskLikelihoodValue: {
    type: DataTypes.INTEGER,
    field: 'risk_likelihood_value',
  },
  riskLikelihoodRating: {
    type: DataTypes.TEXT,
    field: 'risk_likelihood_rating', 
  },
  ermLikelihoodRating: {
    type: DataTypes.TEXT,
    field: 'erm_likelihood_rating', 
  },
  operationalImpactDescription: {
    type: DataTypes.TEXT,
    field: 'operational_impact_description',
  },
  businessImpactDescription: {
    type: DataTypes.TEXT,
    field: 'business_impact_description',
  },
  healthSafetyRating: {
    type: DataTypes.INTEGER,
    field: 'health_safety_rating',
  },
  environmentImpactRating: {
    type: DataTypes.INTEGER,
    field: 'environment_impact_rating',
  },
  financialImpactRating: {
    type: DataTypes.INTEGER,
    field: 'financial_impact_rating',
  },
  reputationalImpactRating: {
    type: DataTypes.INTEGER,
    field: 'reputational_impact_rating',
  },
  legalImpactRating: {
    type: DataTypes.INTEGER,
    field: 'legal_impact_rating',
  },
  complianceImpactRating: {
    type: DataTypes.INTEGER,
    field: 'compliance_impact_rating',
  },
  objectivesAndProductionOperationsImpactRating: {
    type: DataTypes.INTEGER,
    field: 'objectives_and_production_operations_impact_rating',
  },
  riskImpactValue: {
    type: DataTypes.INTEGER,
    field: 'risk_impact_value',
  },
  riskImpactRating: {
    type: DataTypes.TEXT,
    field: 'risk_impact_rating', 
  },
  inherentRisk: {
    type: DataTypes.TEXT,
    field: 'inherent_risk', 
  },
  currentRiskValue: {
    type: DataTypes.INTEGER,
    field: 'current_risk_value',
  },
  currentRiskRating: {
    type: DataTypes.TEXT,
    field: 'current_risk_rating', 
  },
  ermRiskRating: {
    type: DataTypes.TEXT,
    field: 'erm_risk_rating', 
  },
  riskOwner: {
    type: DataTypes.TEXT,
    field: 'risk_owner',
  },
  riskTreatmentPlan1: {
    type: DataTypes.TEXT,
    field: 'risk_treatment_plan_1',
  },
  riskTreatmentPlan2: {
    type: DataTypes.TEXT,
    field: 'risk_treatment_plan_2',
  },
  riskTreatmentPlan3: {
    type: DataTypes.TEXT,
    field: 'risk_treatment_plan_3',
  },
  riskTreatmentPlan4: {
    type: DataTypes.TEXT,
    field: 'risk_treatment_plan_4',
  },
  riskTreatmentPlan5: {
    type: DataTypes.TEXT,
    field: 'risk_treatment_plan_5',
  },
  revisedRiskLikelihoodRating: {
    type: DataTypes.TEXT,
    field: 'revised_risk_likelihood_rating', 
  },
  revisedRiskImpactRating: {
    type: DataTypes.TEXT,
    field: 'revised_risk_impact_rating', 
  },
  targetRiskRating: {
    type: DataTypes.TEXT,
    field: 'target_risk_rating', 
  },
  department: {
    type: DataTypes.TEXT,
    field: 'department',
  },
}, {
  tableName: 'master_questions',
  timestamps: true,
  underscored: true,
});

export default MasterQuestion;
