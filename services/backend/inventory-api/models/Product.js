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
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
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
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'supplier_id',
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_updated',
  },
}, {
  tableName: 'products',
  timestamps: true,
});

export default Product;
