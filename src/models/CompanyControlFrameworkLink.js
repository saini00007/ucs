import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CompanyControlFrameworkLink = sequelize.define('CompanyControlFrameworkLink', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    companyId: {
        type: DataTypes.UUID,
        references: {
            model: 'companies',
            key: 'id',
        },
        allowNull: false,
    },
    controlFrameworkId: {
        type: DataTypes.UUID,
        references: {
            model: 'control_frameworks',
            key: 'id',
        },
        allowNull: false,
    }
}, {
    tableName: 'company_control_frameworks',
    timestamps: true,
    underscored: true,
});


export default CompanyControlFrameworkLink;