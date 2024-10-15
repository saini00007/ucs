import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.STRING(12),
    primaryKey: true,
  },
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  role_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'roles',
      key: 'role_id',
    },
  },
  department_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'departments',
      key: 'department_id',
    },
    onDelete: 'CASCADE',
  },
  company_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'companies',
      key: 'company_id',
    },
    onDelete: 'CASCADE',
  },
  phone_number: {  // New field added
    type: DataTypes.STRING(15),  // Adjust length as necessary
    allowNull: true,  // Allow null values if not required
  },
}, {
  tableName: 'users',
  timestamps: false,
});

export default User;
