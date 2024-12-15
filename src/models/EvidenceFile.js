import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EvidenceFile = sequelize.define('EvidenceFile', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  fileName: {
    type: DataTypes.TEXT,
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pdfData: {
    type: DataTypes.BLOB,
    allowNull: false,
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  answerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'answers',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'evidence_files',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

export default EvidenceFile;
