import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors());
app.use(express.json());

// Anti-abuse rate limiting for coupon validation endpoint
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'बहुत अधिक प्रयास (Rate limit reached)। कृपया 15 मिनट बाद पुन: प्रयास करें।'
  }
});

app.use('/api', apiLimiter);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Credofix Coupon & Payout Service',
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Credofix Backend Server running on port ${PORT}`);
  console.log(`📍 API Endpoint: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
