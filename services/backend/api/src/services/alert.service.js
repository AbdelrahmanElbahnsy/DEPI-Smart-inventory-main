import { Alert, Product } from '../models/index.js';
import { emitEvent } from '../config/socket.js';

export const calculateStockStatus = (quantity, minStock, maxStock) => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity < minStock) return 'low_stock';
  if (quantity > maxStock) return 'overstock';
  return 'in_stock';
};

export const generateAlerts = async (product) => {
  const status = calculateStockStatus(product.quantity, product.minStock, product.maxStock);

  if (status === 'in_stock') return;

  const alertTypeMap = {
    out_of_stock: { type: 'out_of_stock', severity: 'critical', msg: `${product.name} is OUT OF STOCK` },
    low_stock: { type: 'low_stock', severity: 'warning', msg: `${product.name} is running low (${product.quantity} left, min: ${product.minStock})` },
    overstock: { type: 'overstock', severity: 'info', msg: `${product.name} is overstocked (${product.quantity} units, max: ${product.maxStock})` },
  };

  const config = alertTypeMap[status];
  if (!config) return;

  // Check if unread alert already exists for this product + type
  const existing = await Alert.findOne({
    where: { productId: product.id, type: config.type, isRead: false },
  });

  if (!existing) {
    const alert = await Alert.create({
      productId: product.id,
      type: config.type,
      message: config.msg,
      severity: config.severity,
    });

    try {
      emitEvent('new-alert', alert);
    } catch (e) {
      // Socket not initialized yet during seeding
    }
  }
};

export const getAlertStats = async () => {
  const alerts = await Alert.findAll({
    where: { isRead: false },
    include: [{ association: 'product', attributes: ['name', 'sku', 'quantity'] }],
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  return alerts;
};
