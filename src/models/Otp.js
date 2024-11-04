import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Otp = sequelize.define('Otp', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id',
  },
  userId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    field: 'user_id',
  },
  otpCode: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'otp_code',
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at',
  },
}, {
  tableName: 'otp',
  timestamps: false,
  underscored: true,
});


export default Otp;
