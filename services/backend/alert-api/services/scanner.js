import cron from 'node-cron';
import { Alert, Product } from '../models/index.js';

/**
 * Scans all products and generates alerts for stock issues.
 * Runs every 5 minutes in production.
 */
const scanForAlerts = async () => {
  try {
    const products = await Product.findAll();
    let generated = 0;

    for (const product of products) {
      const { id, name, quantity, minStock, maxStock } = product;

      // Determine alert type
      let alertConfig = null;

      if (quantity === 0) {
        alertConfig = {
          type: 'out_of_stock',
          severity: 'critical',
          message: `${name} is OUT OF STOCK (0 units remaining)`,
        };
      } else if (quantity < minStock) {
        alertConfig = {
          type: 'low_stock',
          severity: 'warning',
          message: `${name} is running low — ${quantity} units left (minimum: ${minStock})`,
        };
      } else if (quantity > maxStock) {
        alertConfig = {
          type: 'overstock',
          severity: 'info',
          message: `${name} is overstocked — ${quantity} units (maximum: ${maxStock})`,
        };
      }

      if (!alertConfig) continue;

      // Check if an unread alert already exists for this product + type
      const existing = await Alert.findOne({
        where: {
          productId: id,
          type: alertConfig.type,
          isRead: false,
        },
      });

      if (!existing) {
        await Alert.create({
          productId: id,
          type: alertConfig.type,
          severity: alertConfig.severity,
          message: alertConfig.message,
        });
        generated++;
      }
    }

    if (generated > 0) {
      console.log(`🔔 Alert Scanner: Generated ${generated} new alert(s)`);
    }
  } catch (error) {
    console.error('❌ Alert Scanner error:', error.message);
  }
};

/**
 * Start the cron-based alert scanner.
 * Runs every 5 minutes.
 */
export const startAlertScanner = () => {
  console.log('🔔 Alert Scanner started — checking every 5 minutes');

  // Run immediately on startup
  scanForAlerts();

  // Then run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    scanForAlerts();
  });
};

export { scanForAlerts };
