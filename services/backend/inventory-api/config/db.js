import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'inventory_dashboard',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async (retries = 5, delay = 5000) => {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const name = process.env.DB_NAME || 'inventory_dashboard';
  while (retries > 0) {
    try {
      console.log(`📡 Inventory API — DB Connection attempt: ${host}:${port} [${name}] (retries left: ${retries - 1})`);
      await sequelize.authenticate();
      console.log('✅ Inventory API — PostgreSQL connected successfully');
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      console.log('✅ Inventory API — Tables synced successfully');
      return; // Success, exit function
    } catch (error) {
      retries -= 1;
      console.error('❌ Inventory API — DB connection failed:', error.message);
      if (retries === 0) {
        console.error('❌ Inventory API — DB connection failed after maximum retries. Exiting server...');
        process.exit(1);
      }
      console.log(`🕒 Waiting ${delay / 1000}s before next connection attempt...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export { connectDB, sequelize };
export default sequelize;
