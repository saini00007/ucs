import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const NIST80082Control = sequelize.define('NIST80082Control', {
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
    tableName: 'nist_800_82_controls',
    timestamps: true,
    underscored: true,
});

NIST80082Control.associate = (models) => {
    NIST80082Control.belongsTo(models.MasterQuestion, {
        foreignKey: 'masterQuestionId',
        as: 'masterQuestion'
    });
};

export default NIST80082Control;