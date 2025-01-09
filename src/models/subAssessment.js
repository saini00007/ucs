import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SubAssessment = sequelize.define('SubAssessment', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    assessmentId: {
        type: DataTypes.UUID,
        references: {
            model: 'assessments',
            key: 'id',
        },
        allowNull: false,
        onDelete: 'CASCADE',
    },
    subDepartmentId: {
        type: DataTypes.UUID,
        references: {
            model: 'sub_departments',
            key: 'id'
        },
        allowNull: false,
        onDelete: 'CASCADE',
    }
    ,
    subAssessmentName: {
        type: DataTypes.STRING,
        defaultValue: 'default',
    },
    subAssessmentStarted: {
        type: DataTypes.BOOLEAN, 
        defaultValue: false,
    },
    submitted: {
        type: DataTypes.BOOLEAN, //assessor
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
    }
}, {
    tableName: 'sub_assessments',
    timestamps: true,
    underscored: true,
    paranoid: true,
});

SubAssessment.associate = (models) => {
    // Assessment association
    SubAssessment.belongsTo(models.Assessment, {
        foreignKey: 'assessmentId',
        targetKey: 'id',
        as: 'assessment'
    });

    SubAssessment.belongsTo(models.SubDepartment, {
        foreignKey: 'subDepartmentId',
        targetKey: 'id',
        as: 'subDepartment'
    });

    //  AssessmentQuestion association
    SubAssessment.hasMany(models.AssessmentQuestion, {
        foreignKey: 'subAssessmentId',
        as: 'questions'
    });
};

export default SubAssessment;