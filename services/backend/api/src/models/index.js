import User from './User.js';
import Product from './Product.js';
import Supplier from './Supplier.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Alert from './Alert.js';
import Report from './Report.js';

// Associations
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

Supplier.hasMany(Order, { foreignKey: 'supplierId', as: 'orders' });
Order.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(Alert, { foreignKey: 'productId', as: 'alerts' });
Alert.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Report, { foreignKey: 'generatedBy', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'generatedBy', as: 'generatedByUser' });

export { User, Product, Supplier, Order, OrderItem, Alert, Report };
