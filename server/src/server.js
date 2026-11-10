
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const dns = require('dns');

// Use public DNS servers only for local development.
// Render production will use its default DNS configuration.
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');

    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\nCourse Marketplace API Server');
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: /api`);
      console.log(`Health Check: /api/health`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Server started successfully.');
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
