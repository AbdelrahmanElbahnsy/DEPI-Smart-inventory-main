import { connectDB } from '../../backend/api/src/config/db.js';
import { seedDatabase } from '../../backend/api/src/utils/seedData.js';

const isMainModule = process.argv[1]?.includes('seedData');

if (isMainModule) {
  try {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

export { seedDatabase };
