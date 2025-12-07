const express = require('express');
const cors = require('cors');
const bmiRoutes = require('./routes/bmi');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'https://lab11-front-end.vercel.app',
  'http://localhost:3000', // for local development
  'http://localhost:5173'  // for Vite local development
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Request received: ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/bmi', bmiRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('BMI Calculator API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
