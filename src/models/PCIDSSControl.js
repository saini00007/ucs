import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PCIDSSControl = sequelize.define('PCIDSSControl', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    masterQuestionId: {
        type: DataTypes.UUID,
        references: {
            model: 'master_questions',
            key: 'id'
        },
    },
    controlId: {
        type: DataTypes.TEXT,
    },
    controlDetails: {
        type: DataTypes.TEXT,
    }
}, {
    tableName: 'pci_dss_controls',
    timestamps: true,
    underscored: true,
});

PCIDSSControl.associate = (models) => {
    PCIDSSControl.belongsTo(models.MasterQuestion, {
        foreignKey: 'masterQuestionId',
        as: 'masterQuestion'
    });
};

export default PCIDSSControl;