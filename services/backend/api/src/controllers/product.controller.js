import { Product, Supplier, Alert } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateStockStatus, generateAlerts } from '../services/alert.service.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { emitEvent } from '../config/socket.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      const term = search.toLowerCase();
      where[Op.or] = [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('Product.name')), {
          [Op.like]: `%${term}%`,
        }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('Product.sku')), {
          [Op.like]: `%${term}%`,
        }),
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      include: [{ association: 'supplier', attributes: ['id', 'name', 'company'] }],
      order: [['lastUpdated', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ association: 'supplier' }, { association: 'alerts', limit: 5 }],
    });
    if (!product) throw ApiError.notFound('Product not found');
    res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, sku, description, category, price, supplierId, minStock, maxStock, quantity } = req.body;
    const status = calculateStockStatus(parseInt(quantity) || 0, parseInt(minStock) || 10, parseInt(maxStock) || 1000);

    // Handle image: either uploaded file or URL from body
    let image = req.body.image || null;
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.create({
      name, sku, description, category, price: parseFloat(price), image,
      supplierId: supplierId || null,
      minStock: parseInt(minStock) || 10,
      maxStock: parseInt(maxStock) || 1000,
      quantity: parseInt(quantity) || 0,
      status, lastUpdated: new Date(),
    });

    await generateAlerts(product);
    try { emitEvent('stock-update', { productId: product.id, productName: product.name, action: 'created' }); } catch(e) {}
    res.status(201).json({ success: true, message: 'Product created', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw ApiError.notFound('Product not found');

    const updates = { ...req.body, lastUpdated: new Date() };

    // Handle image upload
    if (req.file) {
      updates.image = `/uploads/products/${req.file.filename}`;
    }

    if (updates.quantity !== undefined) {
      updates.quantity = parseInt(updates.quantity);
      updates.status = calculateStockStatus(
        updates.quantity,
        parseInt(updates.minStock) || product.minStock,
        parseInt(updates.maxStock) || product.maxStock
      );
    }
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.minStock) updates.minStock = parseInt(updates.minStock);
    if (updates.maxStock) updates.maxStock = parseInt(updates.maxStock);

    await product.update(updates);
    await generateAlerts(product);
    try { emitEvent('stock-update', { productId: product.id, productName: product.name, action: 'updated', quantity: product.quantity }); } catch(e) {}
    res.json({ success: true, message: 'Product updated', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw ApiError.notFound('Product not found');
    const productName = product.name;
    await product.destroy();
    try { emitEvent('stock-update', { productId: req.params.id, productName, action: 'deleted' }); } catch(e) {}
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

export const getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.count();
    const lowStock = await Product.count({ where: { status: 'low_stock' } });
    const outOfStock = await Product.count({ where: { status: 'out_of_stock' } });
    const overstock = await Product.count({ where: { status: 'overstock' } });
    const valueResult = await Product.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.literal('price * quantity')), 'totalValue']],
      raw: true,
    });
    const inventoryValue = parseFloat(valueResult[0]?.totalValue || 0);

    const categories = await Product.findAll({
      attributes: ['category'],
      group: ['category'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStock,
        outOfStock,
        overstock,
        inventoryValue,
        totalCategories: categories.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      raw: true,
    });
    res.json({ success: true, data: { categories: categories.map(c => c.category).filter(Boolean) } });
  } catch (error) {
    next(error);
  }
};
