import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  departmentId: {
    type: DataTypes.UUID,
    references: {
      model: 'departments',
      key: 'id',
    },
    allowNull: false,
    onDelete: 'CASCADE',
  },
  assessmentName: {
    type: DataTypes.STRING,
    defaultValue: 'default',
  },
  assessmentStarted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  submitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // assessmentType: {
  //   type: DataTypes.STRING,
  //   defaultValue: 'default',
  //   allowNull: true
  // }
}, {
  tableName: 'assessments',
  timestamps: true,
  underscored: true,
  paranoid: true,
});

Assessment.associate = (models) => {
  // Department association
  Assessment.belongsTo(models.Department, {
    foreignKey: 'departmentId',
    targetKey: 'id',
    as: 'department'
  });

  // AssessmentQuestion association
  Assessment.hasMany(models.AssessmentQuestion, {
    foreignKey: 'assessmentId',
    as: 'questions'
  });

  Assessment.hasMany(models.SubAssessment, {
    foreignKey: 'assessmentId',
    as: 'subAssessments'
  })

};

export default Assessment;
