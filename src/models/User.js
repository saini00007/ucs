import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const generateUserId = async (username) => {
  const prefix = username.slice(0, 4).toLowerCase();
  let uniqueId = prefix + Math.floor(Math.random() * 9000 + 1000).toString();

  const existingUser = await User.findOne({ where: { id: uniqueId } });
  if (existingUser) {
    return generateUserId(username);
  }
  return uniqueId;
};

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(12),
    primaryKey: true,
    field: 'id',
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
      key: 'id',
    },
    field: 'role_id',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'department_id',
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id',
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
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: async (user, options) => {
      if (!user.id && user.username) {
        user.id = await generateUserId(user.username);
      }
    },
  },
});


export default User;
