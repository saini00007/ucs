import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  companyName: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  companyLogo: {
    type: DataTypes.BLOB,
    allowNull: true,
  },
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  gstNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  panNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  primaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  secondaryEmail: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  primaryPhone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  secondaryPhone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  primaryCountryCode: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  secondaryCountryCode: {
    type: DataTypes.STRING(5),
    allowNull: true,
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