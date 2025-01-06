import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  departmentName: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.UUID,
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
    allowNull: false,
  },
  masterDepartmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'master_departments',
      key: 'id',
    },
    allowNull: false,
  },
  createdByUserId: {
    type: DataTypes.STRING(12),
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: false,
  },
}, {
  tableName: 'departments',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

Department.associate = (models) => {
  // User association (many-to-many)
  Department.belongsToMany(models.User, { 
    through: models.UserDepartmentLink, 
    foreignKey: 'departmentId', 
    as: 'users' 
  });
  
  // Company association
  Department.belongsTo(models.Company, { 
    foreignKey: 'companyId', 
    targetKey: 'id', 
    as: 'company' 
  });
  
  // Assessment association
  Department.hasMany(models.Assessment, { 
    foreignKey: 'departmentId', 
    as: 'assessments' 
  });
  
  // MasterDepartment association
  Department.belongsTo(models.MasterDepartment, { 
    foreignKey: 'masterDepartmentId', 
    targetKey: 'id', 
    as: 'masterDepartment' 
  });
};

export default Department;
