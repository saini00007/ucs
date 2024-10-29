import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EvidenceFile = sequelize.define('EvidenceFile', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id', 
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'file_path', 
  },
  pdfData: {
    type: DataTypes.BLOB,
    allowNull: false, 
    field: 'pdf_data', 
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false, 
    field: 'created_by_user_id',
  },
  assessmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'assessments',
      key: 'id',
    },
    allowNull: false,
    field: 'assessment_id', 
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'evidence_files',
  timestamps: false,
});

export default EvidenceFile;
