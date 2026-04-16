import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING(100),
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  image: {
    type: DataTypes.STRING(500),
  },
  supplierId: {
    type: DataTypes.INTEGER,
    field: 'supplier_id',
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
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock', 'overstock'),
    defaultValue: 'in_stock',
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_updated',
  },
}, {
  tableName: 'products',
});

export default Product;
