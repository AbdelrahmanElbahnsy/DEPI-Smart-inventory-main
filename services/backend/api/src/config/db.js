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

export const connectDB = async () => {
  try {
    console.log(`📡 DB Connection: ${config.db.host}:${config.db.port} [${config.db.name}]`);
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Auto-sync tables (safe for both dev/prod)
    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    console.log('✅ Tables synced');
    
  } catch (error) {
    console.error('❌ DB connection error:', error.message);
    process.exit(1);
  }
};

export default sequelize;
