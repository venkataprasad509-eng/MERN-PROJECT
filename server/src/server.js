const dns = require('dns');

// Use public DNS servers for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log('\nCourse Marketplace API Server');
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Server started successfully.');
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();