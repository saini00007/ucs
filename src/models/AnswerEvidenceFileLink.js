import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AnswerEvidenceFileLink = sequelize.define('AnswerEvidenceFileLink', {
  answerId: {
    type: DataTypes.UUID,
    references: {
      model: 'answers',
      key: 'id',
    },
    primaryKey: true,
    onDelete: 'CASCADE',
    field: 'answer_id',
  },
  evidenceFileId: {
    type: DataTypes.UUID,
    references: {
      model: 'evidence_files',
      key: 'id',
    },
    primaryKey: true,
    onDelete: 'CASCADE',
    field: 'evidence_file_id',
  }
}, {
  tableName: 'answer_evidence_file_links',
  timestamps: false,
  underscored: true,
});

export default AnswerEvidenceFileLink;
