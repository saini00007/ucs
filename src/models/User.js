import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { ROLE_IDS } from '../utils/constants.js';

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
  firstName: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  middleName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastName: {
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
        if (this.roleId !== ROLE_IDS.SUPER_ADMIN && !value) {
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
        if (this.roleId !== ROLE_IDS.SUPER_ADMIN && !value) {
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
        if (this.roleId !== ROLE_IDS.SUPER_ADMIN && !value) {
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
      if (!user.id && user.firstName) {
        user.id = await generateUserId(user.firstName);
      }
    },
  },
});

User.associate = (models) => {
  // Company association
  User.belongsTo(models.Company, {
    foreignKey: 'companyId',
    targetKey: 'id',
    as: 'company'
  });

  // Department association (many-to-many)
  User.belongsToMany(models.Department, {
    through: models.UserDepartmentLink,
    foreignKey: 'userId',
    as: 'departments'
  });

  // Department association (many-to-many)
  User.belongsToMany(models.SubDepartment, {
    through: models.UserSubDepartmentLink,
    foreignKey: 'userId',
    as: 'subDepartments'
  });

  // Role association
  User.belongsTo(models.Role, {
    foreignKey: 'roleId',
    targetKey: 'id',
    as: 'role'
  });

  // Otp association
  User.hasMany(models.Otp, {
    foreignKey: 'userId',
    as: 'otps'
  });

  // Answer association
  User.hasMany(models.Answer, {
    foreignKey: 'createdByUserId',
    as: 'createdAnswers'
  });

  // Comment association
  User.hasMany(models.Comment, {
    foreignKey: 'createdByUserId',
    as: 'createdComments'
  });

  // EvidenceFile association
  User.hasMany(models.EvidenceFile, {
    foreignKey: 'createdByUserId',
    as: 'createdEvidenceFiles'
  });
};

export default User;
