import Product from '../models/Product.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

/**
 * Calculate stock status based on quantity, min, and max thresholds
 */
const calculateStockStatus = (quantity, minStock, maxStock) => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity < minStock) return 'low_stock';
  if (quantity > maxStock) return 'overstock';
  return 'in_stock';
};

/**
 * GET /api/inventory
 * Returns full inventory overview: total value, product count, status counts, category distribution
 */
export const getInventoryOverview = async (req, res, next) => {
  try {
    // Total value
    const valueResult = await Product.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'totalValue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalProducts'],
      ],
      raw: true,
    });

    const totalValue = parseFloat(valueResult[0]?.totalValue || 0);
    const totalProducts = parseInt(valueResult[0]?.totalProducts || 0);

    // Status counts
    const statuses = await Product.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const statusCounts = { in_stock: 0, low_stock: 0, out_of_stock: 0, overstock: 0 };
    statuses.forEach(s => { statusCounts[s.status] = parseInt(s.count); });

    // Category distribution
    const categories = await Product.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'value'],
      ],
      group: ['category'],
      raw: true,
    });

    const categoryDistribution = categories.map(c => ({
      name: c.category || 'Uncategorized',
      count: parseInt(c.count),
      value: parseFloat(c.value || 0),
    }));

    res.json({
      success: true,
      data: {
        totalValue,
        totalProducts,
        statusCounts,
        categoryDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/trends
 * Returns monthly stock movement data for line/bar charts
 */
export const getInventoryTrends = async (req, res, next) => {
  try {
    // Compute a real trend series from database state.
    // We group by the month of `last_updated` and sum total inventory value (price * quantity).
    // Note: inbound/outbound movement requires an event log (orders/stock history) which this microservice
    // does not store; we return 0 for these fields rather than random values.

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1); // last 6 months, inclusive

    const rows = await Product.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('last_updated')), 'month'],
        [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'value'],
      ],
      where: {
        lastUpdated: { [Op.gte]: start },
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('last_updated'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('last_updated')), 'ASC']],
      raw: true,
    });

    const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = (d) => d.toLocaleString('en-US', { month: 'short' });

    const valueByMonth = new Map(
      rows.map((r) => {
        const d = new Date(r.month);
        return [monthKey(d), parseFloat(r.value || 0)];
      })
    );

    const trends = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = monthKey(d);
      trends.push({
        month: monthLabel(d),
        value: Math.round(valueByMonth.get(key) || 0),
        inbound: 0,
        outbound: 0,
      });
    }

    res.json({ success: true, data: { trends } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/categories
 * Returns category distribution for charts
 */
export const getCategoryDistribution = async (req, res, next) => {
  try {
    const categories = await Product.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'value'],
      ],
      group: ['category'],
      raw: true,
    });

    const distribution = categories.map(c => ({
      name: c.category || 'Uncategorized',
      count: parseInt(c.count),
      value: parseFloat(c.value || 0),
    }));

    res.json({ success: true, data: { categories: distribution } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/status/:status
 * Returns products filtered by stock status
 */
export const getProductsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const validStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'overstock'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status filter' });
    }

    const products = await Product.findAll({
      where: { status },
      order: [['last_updated', 'DESC']],
    });

    res.json({ success: true, data: { products, count: products.length } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/inventory/:productId
 * Update stock quantity for a product and recalculate its status
 */
export const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null || isNaN(parseInt(quantity))) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newQuantity = parseInt(quantity);
    const newStatus = calculateStockStatus(newQuantity, product.minStock, product.maxStock);

    await product.update({
      quantity: newQuantity,
      status: newStatus,
      lastUpdated: new Date(),
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          status: product.status,
          lastUpdated: product.lastUpdated,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
