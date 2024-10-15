import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Otp = sequelize.define('Otp', {
  otp_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  otp_code: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  expires_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'otp',
  timestamps: false,
});

export default Otp;
