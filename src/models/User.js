import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING(12),
    primaryKey: true,
    field: 'user_id', 
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
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'roles',
      key: 'role_id',
    },
    field: 'role_id', 
  },
  departmentId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'departments',
      key: 'department_id',
    },
    onDelete: 'CASCADE',
    field: 'department_id', 
  },
  companyId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'companies',
      key: 'company_id',
    },
    onDelete: 'CASCADE',
    field: 'company_id', 
  },
  phoneNumber: {  // New field added
    type: DataTypes.STRING(15),  // Adjust length as necessary
    allowNull: true,  // Allow null values if not required
    field: 'phone_number',  
  },
}, {
  tableName: 'users',
  timestamps: false,
});

export default User;
