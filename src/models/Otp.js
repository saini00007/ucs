import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Otp = sequelize.define('Otp', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
  },
  otpCode: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'otps',
  timestamps: true,
  underscored: true,
});

Otp.associate = (models) => {
  // User association
  Otp.belongsTo(models.User, { 
    foreignKey: 'userId', 
    targetKey: 'id', 
    as: 'user' 
  });
};


export default Otp;
