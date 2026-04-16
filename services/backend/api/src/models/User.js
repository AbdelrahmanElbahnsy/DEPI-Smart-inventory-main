import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('owner', 'manager', 'security', 'staff'),
    defaultValue: 'staff',
  },
  phone: {
    type: DataTypes.STRING(50),
    defaultValue: null,
  },
  avatar: {
    type: DataTypes.STRING(500),
    defaultValue: null,
  },
}, {
  tableName: 'users',
});

export default User;
