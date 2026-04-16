import { Alert, Product } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/alerts
 * Returns all alerts with optional type/isRead filters
 */
export const getAlerts = async (req, res, next) => {
  try {
    const { type, isRead, limit = 50 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const alerts = await Alert.findAll({
      where,
      include: [{ association: 'product', attributes: ['id', 'name', 'sku', 'quantity'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    res.json({ success: true, data: { alerts } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts/:id
 */
export const getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id, {
      include: [{ association: 'product', attributes: ['id', 'name', 'sku', 'quantity'] }],
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, data: { alert } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/alerts/:id/read
 */
export const markAlertRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    await alert.update({ isRead: true });
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/alerts/read-all
 */
export const markAllRead = async (req, res, next) => {
  try {
    await Alert.update({ isRead: true }, { where: { isRead: false } });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/alerts/:id
 */
export const dismissAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    await alert.destroy();
    res.json({ success: true, message: 'Alert dismissed' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts/stats
 */
export const getAlertStats = async (req, res, next) => {
  try {
    const totalAlerts = await Alert.count();
    const unreadAlerts = await Alert.count({ where: { isRead: false } });
    const criticalAlerts = await Alert.count({ where: { severity: 'critical', isRead: false } });
    const warningAlerts = await Alert.count({ where: { severity: 'warning', isRead: false } });

    res.json({
      success: true,
      data: {
        totalAlerts,
        unreadAlerts,
        criticalAlerts,
        warningAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};
