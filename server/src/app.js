
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

// ========================================
// EXISTING ROUTES
// ========================================

const courseRoutes = require('./routes/courseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const authRoutes = require('./routes/authRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// AI and Chatbot Routes
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// ========================================
// CORS CONFIGURATION
// ========================================

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://course-market-frontend.vercel.app',
];

// Add CLIENT_URL from Render environment variables
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Combine and remove duplicate origins
const allowedClientOrigins = [
  ...new Set([...allowedOrigins, ...configuredOrigins]),
];

// Vercel preview deployment support
const vercelPreviewOrigin =
  /^https:\/\/course-market-frontend-[a-z0-9-]+\.vercel\.app$/i;

// Apply CORS only once
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedClientOrigins.includes(origin) ||
        vercelPreviewOrigin.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      console.error('CORS blocked origin:', origin);

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-session-id',
    ],
  })
);

// ========================================
// BODY PARSER MIDDLEWARE
// ========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========================================
// REQUEST LOGGER
// ========================================

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    next();
  });
}

// ========================================
// HEALTH CHECK
// ========================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LearnHub API is running',
    healthCheck: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Course Marketplace API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// ========================================
// AUTHENTICATION ROUTES
// ========================================

app.use('/api/auth', authRoutes);

// ========================================
// COURSE ROUTES
// ========================================

app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// ========================================
// CART AND ENROLLMENT ROUTES
// ========================================

app.use('/api/cart', cartRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// ========================================
// INSTRUCTOR AND ADMIN ROUTES
// ========================================

app.use('/api/instructor', instructorRoutes);
app.use('/api/admin', adminRoutes);

// ========================================
// PAYMENT ROUTES
// ========================================

app.use('/api/payments', paymentRoutes);

// ========================================
// AI ROUTES
// ========================================

app.use('/api/ai', aiRoutes);

// ========================================
// CHATBOT ROUTES
// ========================================

app.use('/api/chats', chatRoutes);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404,
  });
});

// ========================================
// CENTRALIZED ERROR HANDLER
// ========================================

app.use(errorHandler);

module.exports = app;
