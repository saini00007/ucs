import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// generating user id for users
const generateUserId = async (username) => {

  const prefix = username.slice(0, 4).toLowerCase().padEnd(4, 'x');;
  let uniqueId = prefix + Math.floor(Math.random() * 90000000 + 10000000).toString();

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
    unique: true, 
  },
  roleId: {
    type: DataTypes.STRING,
    references: {
      model: 'roles',
      key: 'id',
    },
    allowNull: false,
  },
  countryCode: {
    type: DataTypes.STRING(5),
    allowNull: true,
    validate: {
      // allow null for superadmin only
      isRequiredIfNotSuperAdmin(value) {
        if (this.roleId !== 'superadmin' && !value) {
          throw new Error('Country code is required for non-superadmin users');
        }
      },
    },
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
    validate: {
      // allow null for superadmin only
      isRequiredIfNotSuperAdmin(value) {
        if (this.roleId !== 'superadmin' && !value) {
          throw new Error('Company ID is required for non-superadmin users');
        }
      },
    },
  },
  phoneNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      // allow null for superadmin only
      isRequiredIfNotSuperAdmin(value) {
        if (this.roleId !== 'superadmin' && !value) {
          throw new Error('Phone number is required for non-superadmin users');
        }
      },
    },
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  paranoid: true,
  hooks: {
    beforeValidate: async (user, options) => {
      if (!user.id && user.username) {
        user.id = await generateUserId(user.username);
      }
    },
  },
});


export default User;
