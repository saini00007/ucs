import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  companyLegalName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tradeName: {
    type: DataTypes.STRING,
  },
  website: {
    type: DataTypes.STRING,
  },
  incorporationDate: {
    type: DataTypes.DATE
  },
  companySize: {
    type: DataTypes.STRING
  },
  streetAddress: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  country: {
    type: DataTypes.STRING
  },
  companyLogo: {
    type: DataTypes.BLOB,
  },
  postalCode: {
    type: DataTypes.STRING,
  },
  taxIdType: {
    type: DataTypes.STRING
  },
  taxIdNumber: {
    type: DataTypes.STRING
  },
  companyRegistrationNumber: {
    type: DataTypes.STRING
  },
  panReferenceNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  primaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  secondaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  primaryPhone: {
    type: DataTypes.TEXT,
  },
  secondaryPhone: {
    type: DataTypes.TEXT,
  },
  primaryCountryCode: {
    type: DataTypes.STRING(5),
  },
  secondaryCountryCode: {
    type: DataTypes.STRING(5),
  },
  auditCompletionDeadline: {
    type: DataTypes.DATE,
  },
  annualRevenueRange: {
    type: DataTypes.STRING,
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
  },
  industrySectorId: {
    type: DataTypes.UUID,
    references: {
      model: 'industry_sectors',
      key: 'id',
    },
    allowNull: true,
  },
  detailsStatus: {
    type: DataTypes.ENUM('incomplete', 'complete'),
    defaultValue: 'incomplete'
  },
  controlFrameworksStatus: {
    type: DataTypes.ENUM('incomplete', 'complete'),
    defaultValue: 'incomplete'
  },
  departmentsStatus: {
    type: DataTypes.ENUM('incomplete', 'complete'),
    defaultValue: 'incomplete'
  }
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

Company.associate = (models) => {
  // User association
  Company.hasMany(models.User, {
    foreignKey: 'companyId',
    as: 'users'
  });

  // Department association
  Company.hasMany(models.Department, {
    foreignKey: 'companyId',
    as: 'departments'
  });

  // IndustrySector association
  Company.belongsTo(models.IndustrySector, {
    foreignKey: 'industrySectorId',
    targetKey: 'id',
    as: 'industrySector'
  });

  Company.belongsToMany(models.ControlFramework, {
    through: models.CompanyControlFrameworkLink,
    foreignKey: 'companyId',
    otherKey: 'controlFrameworkId',
    as: 'controlFrameworks'
  });
};

export default Company;