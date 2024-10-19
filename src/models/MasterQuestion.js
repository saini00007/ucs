import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterQuestion = sequelize.define('MasterQuestion', {
  questionId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'question_id', 
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
  iso270012022ControlIdNumber: {
    type: DataTypes.TEXT,
    field: 'iso_27001_2022_control_id_number', 
  },
  nistCsfControlId: {
    type: DataTypes.TEXT,
    field: 'nist_csf_control_id', 
  },
  mitreDefendControlId: {
    type: DataTypes.TEXT,
    field: 'mitre_defend_control_id', 
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
    field: 'pcidss', 
  },
  suggestedEvidence: {
    type: DataTypes.TEXT,
    field: 'suggested_evidence', 
  },
  department: {
    type: DataTypes.TEXT,
    field: 'department', 
  },
  controlFamilyFullForm: {
    type: DataTypes.TEXT,
    field: 'control_family_full_form', 
  },
}, {
  tableName: 'master_questions',
  timestamps: false,
});

export default MasterQuestion;
