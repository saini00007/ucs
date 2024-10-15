import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterQuestion = sequelize.define('MasterQuestion', {
  question_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  srno: {
    type: DataTypes.INTEGER,
  },
  sp_800_53_control_number: {
    type: DataTypes.TEXT,
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  iso_27001_2022_control_id_number: {
    type: DataTypes.TEXT,
  },
  nist_csf_control_id: {
    type: DataTypes.TEXT,
  },
  mitre_defend_control_id: {
    type: DataTypes.TEXT,
  },
  nist_800_82_control_id: {
    type: DataTypes.TEXT,
  },
  iec_62443_control_id: {
    type: DataTypes.TEXT,
  },
  pcidss: {
    type: DataTypes.TEXT,
  },
  suggested_evidence: {
    type: DataTypes.TEXT,
  },
  department: {
    type: DataTypes.TEXT,
  },
  control_family_full_form: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'master_questions',
  timestamps: false,
});

export default MasterQuestion;
