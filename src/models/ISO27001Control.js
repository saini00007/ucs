import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ISO27001Control = sequelize.define('ISO27001Control', {
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
        field: 'iso_27001_2022_control_id',
    },
    controlDetails: {
        type: DataTypes.TEXT,
    }
}, {
    tableName: 'iso_27001_controls',
    timestamps: true,
    underscored: true,
});

ISO27001Control.associate = (models) => {
    ISO27001Control.belongsTo(models.MasterQuestion, {
        foreignKey: 'masterQuestionId',
        as: 'masterQuestion'
    });
};

export default ISO27001Control;