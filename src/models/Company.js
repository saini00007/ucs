import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'id',
  },
  companyName: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'company_name',
  },
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'postal_address',
  },
  gstNumber: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'gst_number',
  },
  panNumber: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'pan_number',
  },
  primaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'primary_email',
  },
  secondaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'secondary_email',
  },
  primaryPhone: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'primary_phone',
  },
  secondaryPhone: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'secondary_phone',
  },
  primaryCountryCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
    field: 'primary_country_code',
  },
  secondaryCountryCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
    field: 'secondary_country_code',
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
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

export default Company;
