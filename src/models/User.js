import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// generating user id for users
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
    unique: true,  // Ensure email is unique
  },
  roleId: {
    type: DataTypes.STRING,
    references: {
      model: 'roles',
      key: 'id',
    },
    allowNull: false,
    field: 'role_id',
  },
  countryCode: {
    type: DataTypes.STRING(5),
    allowNull: true,
    field: 'country_code',
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
    field: 'company_id',
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
    field: 'phone_number',
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
