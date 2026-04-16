import { getInventoryValue, getInventoryTrends, getCategoryDistribution, getStockStatusCounts, updateProductStock } from '../services/inventory.service.js';
import { Product } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const getInventoryOverview = async (req, res, next) => {
  try {
    const [value, statusCounts, categoryDist] = await Promise.all([
      getInventoryValue(),
      getStockStatusCounts(),
      getCategoryDistribution(),
    ]);

    res.json({
      success: true,
      data: { ...value, statusCounts, categoryDistribution: categoryDist },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      throw ApiError.badRequest('Valid quantity is required');
    }

    const product = await updateProductStock(parseInt(productId), quantity);
    res.json({ success: true, message: 'Stock updated', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const trends = await getInventoryTrends();
    res.json({ success: true, data: { trends } });
  } catch (error) {
    next(error);
  }
};

export const getInventoryTotalValue = async (req, res, next) => {
  try {
    const value = await getInventoryValue();
    res.json({ success: true, data: value });
  } catch (error) {
    next(error);
  }
};
