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
  },
  pdf_data: {
    type: DataTypes.BLOB,  // Store the PDF data as binary
  },
  uploaded_by_user_id: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'evidence_files',
  timestamps: false,
});

export default EvidenceFile;
