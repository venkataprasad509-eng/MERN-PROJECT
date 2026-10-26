
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const app = require('./app');
const aiRoutes = require('./routes/aiRoutes');

const PORT = process.env.PORT || 5000;

app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log('\nCourse Marketplace API Server');
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Server started successfully.');
});
