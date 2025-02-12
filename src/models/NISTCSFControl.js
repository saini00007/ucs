import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const NISTCSFControl = sequelize.define('NISTCSFControl', {
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
    tableName: 'nist_csf_controls',
    timestamps: true,
    underscored: true,
});

NISTCSFControl.associate = (models) => {
    NISTCSFControl.belongsTo(models.MasterQuestion, {
        foreignKey: 'masterQuestionId',
        as: 'masterQuestion'
    });
};

export default NISTCSFControl;