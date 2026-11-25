import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocketIO } from './config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const httpServer = http.createServer(app);
    initSocketIO(httpServer);

    httpServer.listen(PORT, () => {
      console.log(
        `SCMS server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('Failed to start SCMS server:', error.message);
    process.exit(1);
  }
};

startServer();
