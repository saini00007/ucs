import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MITREControl = sequelize.define('MITREControl', {
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
    tableName: 'mitre_controls',
    timestamps: true,
    underscored: true,
});

MITREControl.associate = (models) => {
    MITREControl.belongsTo(models.MasterQuestion, {
        foreignKey: 'masterQuestionId',
        as: 'masterQuestion'
    });
};

export default MITREControl;