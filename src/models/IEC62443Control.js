import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const IEC62443Control = sequelize.define('IEC62443Control', {
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
    tableName: 'iec_62443_controls',
    timestamps: true,
    underscored: true,
});

IEC62443Control.associate = (models) => {
    IEC62443Control.belongsTo(models.MasterQuestion, {
        foreignKey: 'masterQuestionId',
        as: 'masterQuestion'
    });
};

export default IEC62443Control;