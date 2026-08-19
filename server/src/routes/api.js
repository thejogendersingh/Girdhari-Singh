import express from 'express';
import { validateCoupon, redeemCoupon } from '../controllers/couponController.js';
import {
  getDashboardStats,
  getProducts,
  createProduct,
  updateProductReward,
  getBatches,
  createBatch,
  exportBatchCSV,
  getCoupons,
  toggleBlockCoupon,
  getRedemptions,
  getPayouts,
  retryPayout,
  manualPay,
  getFraudLogs
} from '../controllers/adminController.js';

const router = express.Router();

// -------------------------------------------------------------
// CUSTOMER REDEEM ROUTES
// -------------------------------------------------------------
router.post('/coupons/validate', validateCoupon);
router.post('/coupons/redeem', redeemCoupon);

// -------------------------------------------------------------
// ADMIN & MANAGEMENT ROUTES
// -------------------------------------------------------------
router.get('/admin/stats', getDashboardStats);

// Products
router.get('/admin/products', getProducts);
router.post('/admin/products', createProduct);
router.put('/admin/products/:id', updateProductReward);

// Batches & Code Generation
router.get('/admin/batches', getBatches);
router.post('/admin/batches/create', createBatch);
router.get('/admin/batches/:batchId/export', exportBatchCSV);

// Coupons
router.get('/admin/coupons', getCoupons);
router.post('/admin/coupons/:code/block', toggleBlockCoupon);

// Redemptions & Payouts
router.get('/admin/redemptions', getRedemptions);
router.get('/admin/payouts', getPayouts);
router.post('/admin/payouts/retry', retryPayout);
router.post('/admin/payouts/manual', manualPay);

// Fraud logs
router.get('/admin/fraud-logs', getFraudLogs);

export default router;
