import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Action = sequelize.define('Action', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  actionName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'action_name',
  },
}, {
  tableName: 'actions',
  timestamps: true,
  underscored: true,
});

export default Action;
