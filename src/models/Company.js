// models/Company.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  company_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  company_name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  postal_address: {
    type: DataTypes.TEXT, // Registered office address
    allowNull: false,
  },
  gst_number: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional field
  },
  primary_email: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  secondary_email: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional field
  },
  primary_phone: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  secondary_phone: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional field
  },
  created_by: {
    type: DataTypes.STRING(12), // Assuming user_id is a STRING(12)
    references: {
      model: 'users', // Reference to the users table
      key: 'user_id',
    },
    allowNull: true, // Set to false if a creator is mandatory
  },
}, {
  tableName: 'companies',
  timestamps: false,
});

export default Company;
