import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EvidenceFile = sequelize.define('EvidenceFile', {
  evidenceFileId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'evidence_file_id', 
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false, // Required field
    field: 'file_path', 
  },
  pdfData: {
    type: DataTypes.BLOB,
    allowNull: false, // Optional: Required if you always want to store PDF data
    field: 'pdf_data', 
  },
  uploadedByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
    allowNull: false, 
    field: 'uploaded_by_user_id', 
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'uploaded_at', 
  },
  assessmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'assessments',
      key: 'assessment_id',
    },
    allowNull: false,
    field: 'assessment_id', 
  },
}, {
  tableName: 'evidence_files',
  timestamps: false,
});

export default EvidenceFile;
