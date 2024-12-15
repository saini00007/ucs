import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  companyName: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  companyLogo: {
    type: DataTypes.BLOB,
    allowNull: true,   
  },
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  gstNumber: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  panNumber: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  primaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  secondaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  primaryPhone: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  secondaryPhone: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  primaryCountryCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  secondaryCountryCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
  },
  industrySectorId: {
    type: DataTypes.UUID,
    references: {
      model: 'industry_sectors',
      key: 'id',
    },
    allowNull: true,
  },
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

export default Company;