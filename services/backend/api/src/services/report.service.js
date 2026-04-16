import * as XLSX from 'xlsx';
import { Product, Order, Alert, Supplier } from '../models/index.js';

export const generateReport = async (type) => {
  let data = [];
  let title = '';

  switch (type) {
    case 'inventory': {
      title = 'Inventory Report';
      const products = await Product.findAll({
        include: [{ association: 'supplier', attributes: ['name'] }],
        raw: true, nest: true,
      });
      data = products.map((p) => ({
        'Product Name': p.name,
        'SKU': p.sku,
        'Category': p.category,
        'Quantity': p.quantity,
        'Price': p.price,
        'Status': p.status,
        'Supplier': p.supplier?.name || 'N/A',
        'Value': (p.price * p.quantity).toFixed(2),
      }));
      break;
    }
    case 'sales': {
      title = 'Sales Report';
      const orders = await Order.findAll({
        where: { type: 'sale' },
        include: [{ association: 'supplier', attributes: ['name'] }],
        raw: true, nest: true,
      });
      data = orders.map((o) => ({
        'Order #': o.orderNumber,
        'Supplier': o.supplier?.name || 'N/A',
        'Status': o.status,
        'Total': o.totalAmount,
        'Date': new Date(o.createdAt).toLocaleDateString(),
      }));
      break;
    }
    case 'purchases': {
      title = 'Purchase Report';
      const purchases = await Order.findAll({
        where: { type: 'purchase' },
        include: [{ association: 'supplier', attributes: ['name'] }],
        raw: true, nest: true,
      });
      data = purchases.map((o) => ({
        'Order #': o.orderNumber,
        'Supplier': o.supplier?.name || 'N/A',
        'Status': o.status,
        'Total': o.totalAmount,
        'Date': new Date(o.createdAt).toLocaleDateString(),
      }));
      break;
    }
    case 'alerts': {
      title = 'Alerts Report';
      const alerts = await Alert.findAll({
        include: [{ association: 'product', attributes: ['name', 'sku'] }],
        raw: true, nest: true,
      });
      data = alerts.map((a) => ({
        'Product': a.product?.name || 'N/A',
        'SKU': a.product?.sku || 'N/A',
        'Alert Type': a.type,
        'Severity': a.severity,
        'Message': a.message,
        'Read': a.isRead ? 'Yes' : 'No',
        'Date': new Date(a.createdAt).toLocaleDateString(),
      }));
      break;
    }
    default:
      throw new Error('Invalid report type');
  }

  return { title, data, generatedAt: new Date().toISOString() };
};

export const generateExcelBuffer = (reportData) => {
  const ws = XLSX.utils.json_to_sheet(reportData.data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, reportData.title);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
