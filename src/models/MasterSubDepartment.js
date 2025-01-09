import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

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
};

export default MasterSubDepartment;
