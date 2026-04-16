import { Supplier, Product } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import sequelize from '../config/db.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({
      include: [{
        association: 'products',
        attributes: ['id'],
      }],
      order: [['createdAt', 'DESC']],
    });

    const formatted = suppliers.map(s => ({
      ...s.toJSON(),
      productCount: s.products?.length || 0,
      products: undefined,
    }));

    res.json({ success: true, data: { suppliers: formatted } });
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [{ association: 'products' }],
    });
    if (!supplier) throw ApiError.notFound('Supplier not found');
    res.json({ success: true, data: { supplier } });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'Supplier created', data: { supplier } });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) throw ApiError.notFound('Supplier not found');
    await supplier.update(req.body);
    res.json({ success: true, message: 'Supplier updated', data: { supplier } });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) throw ApiError.notFound('Supplier not found');
    await supplier.destroy();
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    next(error);
  }
};
