import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; // Adjust the import based on your sequelize instance location

const AnswerEvidenceFile = sequelize.define('AnswerEvidenceFile', {
  answerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'answers', // Name of the table in the database
      key: 'answer_id'
    },
    primaryKey: true,
    onDelete: 'CASCADE',
  },
  evidenceFileId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'evidence_files', // Name of the table in the database
      key: 'evidence_file_id'
    },
    primaryKey: true,
    onDelete: 'CASCADE',
  }
}, {
  tableName: 'answer_evidence_files',
  timestamps: false // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

export default AnswerEvidenceFile;
