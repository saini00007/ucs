import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import MasterDepartment from './MasterDepartment.js';

const MasterSubDepartment = sequelize.define('MasterSubDepartment', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    subDepartmentName: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
    },
    MasterDepartmentId: {
        type: DataTypes.UUID,
        references: {
            model: 'master_departments',
            key: 'id',
        },
        allowNull: true,
    }

}, {
    tableName: 'master_sub_departments',
    timestamps: true,
    underscored: true,
});

MasterSubDepartment.associate = (models) => {
    // Department association
    MasterSubDepartment.hasMany(models.SubDepartment, {
        foreignKey: 'subDepartmentId',
        as: 'subDepartments'
    });
    MasterSubDepartment.belongsTo(models.MasterDepartment, {
        foreignKey: 'masterDepartmentId',
        targetKey: 'id',
        as: 'masterDepartment'
    })
};


export default MasterSubDepartment;
