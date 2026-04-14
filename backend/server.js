const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

const path = require('path');

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Enable CORS
app.use(cors());

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const auth = require('./routes/authRoutes');
const trade = require('./routes/tradeRoutes');
const journal = require('./routes/journalRoutes');
const payments = require('./routes/mpesaRoutes');
const broker = require('./routes/brokerRoutes');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/trades', trade);
app.use('/api/journal', journal);
app.use('/api/payments', payments);
app.use('/api/broker', broker);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
