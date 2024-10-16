// models/EvidenceFile.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EvidenceFile = sequelize.define('EvidenceFile', {
  evidence_file_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false, // Required field
  },
  pdf_data: {
    type: DataTypes.BLOB,
    allowNull: false, // Optional: Required if you always want to store PDF data
  },
  uploaded_by_user_id: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
    allowNull: false, // Required field
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  assessment_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'assessments',
      key: 'assessment_id',
    },
    allowNull: false,
  },
}, {
  tableName: 'evidence_files',
  timestamps: false,
});

export default EvidenceFile;
