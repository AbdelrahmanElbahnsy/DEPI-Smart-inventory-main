import dotenv from 'dotenv';
// override: false = Docker/system env vars take priority over .env file
dotenv.config({ override: false });

export default {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'inventory_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '102030',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
