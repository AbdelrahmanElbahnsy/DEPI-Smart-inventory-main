import { connectDB } from './src/config/db.js';
import { seedDatabase } from './src/utils/seedData.js';
import { Product } from './src/models/index.js';

/**
 * Self-Contained Seeding Script
 * This ensures the DB is populated using our Sequelize models.
 */
const startSeeding = async () => {
  try {
    console.log('🔄 INITIALIZING SEEDER...');
    
    // Connect to database and FORCE clean slate
    await connectDB();
    
    console.log('⚠️ DROPPING AND RECREATING TABLES (Force Sync)...');
    const { default: sequelize } = await import('./src/config/db.js');
    await sequelize.sync({ force: true });
    
    console.log('🌱 SEEDING DATA...');
    await seedDatabase();
    
    const finalCount = await Product.count();
    console.log(`✅ SUCCESS: ${finalCount} products created.`);
    process.exit(0);
    
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
};

startSeeding();
