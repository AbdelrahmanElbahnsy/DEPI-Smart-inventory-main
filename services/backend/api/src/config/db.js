import { Sequelize } from 'sequelize';
import config from './env.js';

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
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

export const connectDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      console.log(`📡 DB Connection attempt: ${config.db.host}:${config.db.port} [${config.db.name}] (retries left: ${retries - 1})`);
      await sequelize.authenticate();
      console.log('✅ PostgreSQL connected successfully');
      
      // Auto-sync tables (safe for both dev/prod)
      await sequelize.sync({ alter: config.nodeEnv === 'development' });
      console.log('✅ Tables synced successfully');
      return; // Connection and syncing succeeded, break and return
    } catch (error) {
      retries -= 1;
      console.error(`❌ DB connection failed:`, error.message);
      if (retries === 0) {
        console.error('❌ DB connection failed after maximum retries. Exiting server...');
        process.exit(1);
      }
      console.log(`🕒 Waiting ${delay / 1000}s before next connection attempt...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default sequelize;
