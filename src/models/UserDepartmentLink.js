import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserDepartmentLink = sequelize.define('UserDepartmentLink', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'id',
    },
    userId: {
        type: DataTypes.STRING(12),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        field: 'user_id',
    },
    departmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id',
        },
        onDelete: 'CASCADE',
        field: 'department_id',
    },
}, {
    tableName: 'user_departments',
    timestamps: true,
    underscored: true,
});

export default UserDepartmentLink;
