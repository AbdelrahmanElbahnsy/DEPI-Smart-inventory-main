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
    type: DataTypes.ENUM('warning', 'critical', 'info'),
    defaultValue: 'warning',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
}, {
  tableName: 'alerts',
  updatedAt: false,
});

export default Alert;
