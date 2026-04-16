import { Order, OrderItem, Product, Supplier } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { updateProductStock } from '../services/inventory.service.js';
import sequelize from '../config/db.js';
import { emitEvent } from '../config/socket.js';

export const getOrders = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [
        { association: 'supplier', attributes: ['id', 'name', 'company'] },
        { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku'] }] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { supplierId, type, items } = req.body;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    let totalAmount = 0;

    const order = await Order.create({ orderNumber, supplierId, type, status: 'pending', totalAmount: 0 }, { transaction: t });

    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (!product) throw ApiError.badRequest(`Product ${item.productId} not found`);

        const price = item.price || parseFloat(product.price);
        totalAmount += price * item.quantity;

        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price,
        }, { transaction: t });
      }
    }

    await order.update({ totalAmount }, { transaction: t });
    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { association: 'supplier' },
        { association: 'items', include: [{ association: 'product' }] },
      ],
    });

    res.status(201).json({ success: true, message: 'Order created', data: { order: fullOrder } });
    try { emitEvent('order-update', { orderId: order.id, orderNumber: order.orderNumber, status: 'pending', action: 'created' }); } catch(e) {}
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ association: 'items' }],
    });
    if (!order) throw ApiError.notFound('Order not found');

    const { status } = req.body;
    await order.update({ status });

    // If order completed, update stock
    if (status === 'completed' && order.items) {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          const newQty = order.type === 'purchase'
            ? product.quantity + item.quantity
            : Math.max(0, product.quantity - item.quantity);
          await updateProductStock(product.id, newQty);
        }
      }
    }

    res.json({ success: true, message: 'Order status updated', data: { order } });
    try { emitEvent('order-update', { orderId: order.id, orderNumber: order.orderNumber, status, action: 'status-updated' }); } catch(e) {}
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const completedOrders = await Order.count({ where: { status: 'completed' } });

    const totalRevenue = await Order.sum('totalAmount', { where: { type: 'sale', status: 'completed' } }) || 0;
    const totalCost = await Order.sum('totalAmount', { where: { type: 'purchase', status: 'completed' } }) || 0;

    res.json({
      success: true,
      data: { totalOrders, pendingOrders, completedOrders, totalRevenue, totalCost },
    });
  } catch (error) {
    next(error);
  }
};
