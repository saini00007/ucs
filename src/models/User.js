import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const generateUserId = async (username) => {
  const prefix = username.slice(0, 4).toLowerCase();
  let uniqueId = prefix;
  uniqueId += Math.floor(Math.random() * 9000 + 1000).toString();
  
  const existingUser = await User.findOne({ where: { userId: uniqueId } });
  if (existingUser) {
    return generateUserId(username);
  }

  return uniqueId;
};

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
    type: DataTypes.STRING,
    
    references: {
      model: 'roles',
      key: 'role_id',
    },
    field: 'role_id', 
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'department_id',
    },
    onDelete: 'CASCADE',
    field: 'department_id', 
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'company_id',
    },
    onDelete: 'CASCADE',
    field: 'company_id', 
  },
  phoneNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,  
    field: 'phone_number',  
  },
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeValidate: async (user, options) => {
      if (user.username) {
        user.userId = await generateUserId(user.username);
      }
    },
  },
});

export default User;
