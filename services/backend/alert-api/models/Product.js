import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: 'min_stock',
  },
  maxStock: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    field: 'max_stock',
  },
  status: {
    type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock', 'overstock'),
    defaultValue: 'in_stock',
  },
}, {
  tableName: 'products',
  timestamps: true,
});

// Associations are set up in models/index.js — do NOT duplicate here
export default Product;
