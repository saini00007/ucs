import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AnswerEvidenceFile = sequelize.define('AnswerEvidenceFile', {
  answerId: {
    type: DataTypes.UUID,
    references: {
      model: 'answers',
      key: 'answer_id',
    },
    primaryKey: true,
    onDelete: 'CASCADE',
    field: 'answer_id',
  },
  evidenceFileId: {
    type: DataTypes.UUID,
    references: {
      model: 'evidence_files',
      key: 'evidence_file_id',
    },
    primaryKey: true,
    onDelete: 'CASCADE',
    field: 'evidence_file_id',
  }
}, {
  tableName: 'answer_evidence_files',
  timestamps: false,
});

export default AnswerEvidenceFile;
