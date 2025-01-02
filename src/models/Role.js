import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  roleName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true,
});

Role.associate = (models) => {
  // User association
  Role.hasMany(models.User, { 
    foreignKey: 'roleId', 
    as: 'users' 
  });
};

export default Role;
