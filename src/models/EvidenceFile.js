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
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'created_by_user_id',
  },
  answerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'answers',
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'answer_id',
  },
}, {
  tableName: 'evidence_files',
  timestamps: true,
  underscored: true,
});

export default EvidenceFile;
