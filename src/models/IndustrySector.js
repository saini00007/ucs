import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const IndustrySector = sequelize.define('IndustrySector', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    sectorType: {
        type: DataTypes.ENUM('major', 'minor'),
        allowNull: false,
    },
    sectorName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'industry_sectors',
    timestamps: true,
    underscored: true,
    paranoid: true,
});

export default IndustrySector;
