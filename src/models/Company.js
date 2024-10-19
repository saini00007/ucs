// models/Company.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  companyId: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'company_id',
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
    allowNull: true,
    field: 'gst_number',
  },
  primaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'primary_email',
  },
  secondaryEmail: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'secondary_email',
  },
  primaryPhone: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'primary_phone',
  },
  secondaryPhone: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'secondary_phone',
  },
  createdBy: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'user_id',
    },
    allowNull: true,
    field: 'created_by',
  },
}, {
  tableName: 'companies',
  timestamps: false,
});

export default Company;
