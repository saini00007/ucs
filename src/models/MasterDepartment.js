import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterDepartment = sequelize.define('MasterDepartment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  departmentName: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'master_departments',
  timestamps: true,
  underscored: true,
});

MasterDepartment.associate = (models) => {
  // Department association
  MasterDepartment.hasMany(models.Department, { 
    foreignKey: 'masterDepartmentId', 
    as: 'departments' 
  });
  MasterDepartment.hasMany(models.MasterSubDepartment,{
    foreignKey:'masterDepartmentId',
    as:'masterSubDepartments'
  })
  
  // MasterQuestion association (many-to-many)
  MasterDepartment.belongsToMany(models.MasterQuestion, { 
    through: models.QuestionDepartmentLink, 
    foreignKey: 'masterDepartmentId', 
    otherKey: 'masterQuestionId', 
    as: 'masterQuestions' 
  });
};

export default MasterDepartment;
