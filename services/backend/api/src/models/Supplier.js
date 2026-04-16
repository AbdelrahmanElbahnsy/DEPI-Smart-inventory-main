import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(50),
  },
  address: {
    type: DataTypes.TEXT,
  },
  company: {
    type: DataTypes.STRING(255),
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'suppliers',
});

export default Supplier;
