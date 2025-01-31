import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ControlFramework = sequelize.define('ControlFramework', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  frameworkType: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  }
}, {
  tableName: 'control_frameworks',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

ControlFramework.associate = (models) => {
  ControlFramework.belongsToMany(models.Company, {
    through: models.CompanyControlFrameworkLink,
    foreignKey: 'controlFrameworkId',
    otherKey: 'companyId',
    as: 'companies'
  });
};

export default ControlFramework;