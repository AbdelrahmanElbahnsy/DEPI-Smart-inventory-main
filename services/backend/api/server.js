import http from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/config/socket.js';
import config from './src/config/env.js';
import './src/models/index.js';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const start = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

start();
