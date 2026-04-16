import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
  },
  type: {
    type: DataTypes.ENUM('low_stock', 'out_of_stock', 'overstock'),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('critical', 'warning', 'info'),
    defaultValue: 'info',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
}, {
  tableName: 'alerts',
  timestamps: true,
});

export default Alert;
