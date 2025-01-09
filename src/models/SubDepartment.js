import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SubDepartment = sequelize.define('SubDepartment', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    subDepartmentName: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    departmentId: {
        type: DataTypes.UUID,
        references: {
            model: 'departments',
            key: 'id',
        },
        onDelete: 'CASCADE',
        allowNull: false,
    },
    masterSubDepartmentId: {
        type: DataTypes.UUID,
        references: {
            model: 'master_sub_departments',
            key: 'id',
        },
        allowNull: false,
    }
}, {
    tableName: 'sub_departments',
    timestamps: true,
    underscored: true,
    paranoid: true,
});

//department association
SubDepartment.associate = (models) => {
    SubDepartment.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        targetKey: 'id',
        as: 'department'
    }),
        SubDepartment.belongsTo(models.MasterSubDepartment, {
            foreignKey: 'masterSubDepartmentId',
            targetKey: 'id',
            as: 'masterSubDepartment'
        }),
        SubDepartment.hasMany(models.SubAssessment, {
            foreignKey: 'subDepartmentId',
            as: 'subAssessments'
        })


    // User association (many-to-many)
    SubDepartment.belongsToMany(models.User, {
        through: models.UserSubDepartmentLink,
        foreignKey: 'subDepartmentId',
        as: 'users'
    });

}

export default SubDepartment;


