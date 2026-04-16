import { Product } from '../models/index.js';
import sequelize from '../config/db.js';
import { calculateStockStatus, generateAlerts } from './alert.service.js';
import { emitEvent } from '../config/socket.js';

export const updateProductStock = async (productId, newQuantity) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error('Product not found');

  const status = calculateStockStatus(newQuantity, product.minStock, product.maxStock);

  await product.update({
    quantity: newQuantity,
    status,
    lastUpdated: new Date(),
  });

  await generateAlerts(product);
  try { emitEvent('stock-update', { productId: product.id, productName: product.name, quantity: newQuantity, status }); } catch(e) {}
  return product;
};

export const getInventoryValue = async () => {
  const result = await Product.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'totalValue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalProducts'],
    ],
    raw: true,
  });
  return {
    totalValue: parseFloat(result[0]?.totalValue || 0),
    totalProducts: parseInt(result[0]?.totalProducts || 0),
  };
};

export const getInventoryTrends = async () => {
  // Generate realistic monthly trend data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseValue = 45000;
  return months.map((month, i) => ({
    month,
    value: Math.round(baseValue + Math.sin(i * 0.8) * 15000 + Math.random() * 5000),
    inbound: Math.round(200 + Math.random() * 300),
    outbound: Math.round(150 + Math.random() * 250),
  }));
};

export const getCategoryDistribution = async () => {
  const categories = await Product.findAll({
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'value'],
    ],
    group: ['category'],
    raw: true,
  });
  return categories.map((c) => ({
    name: c.category || 'Uncategorized',
    count: parseInt(c.count),
    value: parseFloat(c.value || 0),
  }));
};

export const getStockStatusCounts = async () => {
  const statuses = await Product.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });

  const result = { in_stock: 0, low_stock: 0, out_of_stock: 0, overstock: 0 };
  statuses.forEach((s) => { result[s.status] = parseInt(s.count); });
  return result;
};
