import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Resource = sequelize.define('Resource', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  resourceName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'resource_name',
  },
}, {
  tableName: 'resources',
  timestamps: true,
  underscored: true,
});

export default Resource;
