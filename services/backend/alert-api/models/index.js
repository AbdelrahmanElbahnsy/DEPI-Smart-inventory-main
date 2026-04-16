import Alert from './Alert.js';
import Product from './Product.js';

// ─── Associations ───
Product.hasMany(Alert, { foreignKey: 'product_id', as: 'alerts' });
Alert.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

export { Alert, Product };
