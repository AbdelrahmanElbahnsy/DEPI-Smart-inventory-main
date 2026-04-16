import { Alert } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const getAlerts = async (req, res, next) => {
  try {
    const { type, severity, isRead } = req.query;
    const where = {};
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const alerts = await Alert.findAll({
      where,
      include: [{ association: 'product', attributes: ['id', 'name', 'sku', 'quantity', 'image'] }],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const unreadCount = await Alert.count({ where: { isRead: false } });

    res.json({ success: true, data: { alerts, unreadCount } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) throw ApiError.notFound('Alert not found');
    await alert.update({ isRead: true });
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Alert.update({ isRead: true }, { where: { isRead: false } });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) throw ApiError.notFound('Alert not found');
    await alert.destroy();
    res.json({ success: true, message: 'Alert dismissed' });
  } catch (error) {
    next(error);
  }
};
