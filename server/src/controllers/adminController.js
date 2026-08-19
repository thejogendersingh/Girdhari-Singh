import { db } from '../db.js';
import { generateBatchCodes } from '../services/codeGenerator.js';
import { payoutService } from '../services/payoutService.js';

/**
 * Get overview dashboard stats
 */
export async function getDashboardStats(req, res) {
  try {
    const coupons = db.get('coupons');
    const redemptions = db.get('redemptions');
    const payouts = db.get('payouts');
    const products = db.get('products');

    const totalCodes = coupons.length;
    const unusedCount = coupons.filter(c => c.status === 'UNUSED').length;
    const redeemedCount = coupons.filter(c => c.status === 'PAID' || c.status === 'REDEEMED').length;
    const pendingCount = coupons.filter(c => c.status === 'PAYOUT_PENDING').length;
    const failedCount = coupons.filter(c => c.status === 'PAYOUT_FAILED').length;
    const blockedCount = coupons.filter(c => c.status === 'BLOCKED').length;

    const totalPaidAmount = redemptions
      .filter(r => r.status === 'PAID')
      .reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0);

    const statsByProduct = products.map(prod => {
      const prodCoupons = coupons.filter(c => c.product_id === prod.id);
      const prodRedeemed = prodCoupons.filter(c => c.status === 'PAID' || c.status === 'REDEEMED').length;
      return {
        id: prod.id,
        product_code: prod.product_code,
        product_name: prod.product_name,
        pack_size: prod.pack_size,
        reward_amount: prod.reward_amount,
        total_codes: prodCoupons.length,
        redeemed_codes: prodRedeemed,
        payout_amount: prodRedeemed * prod.reward_amount
      };
    });

    return res.json({
      success: true,
      stats: {
        total_codes: totalCodes,
        unused: unusedCount,
        redeemed: redeemedCount,
        pending: pendingCount,
        failed: failedCount,
        blocked: blockedCount,
        total_payout_amount: totalPaidAmount,
        products: statsByProduct
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * List & Manage Products
 */
export async function getProducts(req, res) {
  return res.json({ success: true, products: db.get('products') });
}

export async function createProduct(req, res) {
  try {
    const { product_code, product_name, pack_size, reward_amount } = req.body;
    if (!product_code || !product_name || !reward_amount) {
      return res.status(400).json({ success: false, message: 'Missing required product fields.' });
    }

    const existing = db.findOne('products', p => p.product_code === String(product_code));
    if (existing) {
      return res.status(400).json({ success: false, message: `Product code ${product_code} already exists.` });
    }

    const newProd = {
      id: String(product_code),
      product_code: String(product_code),
      product_name,
      pack_size: pack_size || 'N/A',
      reward_amount: Number(reward_amount),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.insert('products', newProd);
    return res.json({ success: true, product: newProd, message: 'Product created successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateProductReward(req, res) {
  try {
    const { id } = req.params;
    const { reward_amount, status, product_name } = req.body;

    const updates = {};
    if (reward_amount !== undefined) updates.reward_amount = Number(reward_amount);
    if (status !== undefined) updates.status = status;
    if (product_name !== undefined) updates.product_name = product_name;

    const updated = db.update('products', p => p.id === id, updates);
    if (updated === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Batch & Code Generation
 */
export async function getBatches(req, res) {
  const batches = db.get('batches');
  const products = db.get('products');
  const coupons = db.get('coupons');

  const enrichedBatches = batches.map(b => {
    const prod = products.find(p => p.id === b.product_id);
    const bCoupons = coupons.filter(c => c.batch_id === b.id);
    const redeemed = bCoupons.filter(c => c.status === 'PAID' || c.status === 'REDEEMED').length;

    return {
      ...b,
      product_name: prod ? prod.product_name : `Product ${b.product_id}`,
      pack_size: prod ? prod.pack_size : '',
      redeemed_count: redeemed,
      total_count: bCoupons.length
    };
  });

  return res.json({ success: true, batches: enrichedBatches });
}

export async function createBatch(req, res) {
  try {
    const { product_id, quantity, campaign_id = 'camp_001' } = req.body;
    const qty = Number(quantity);

    if (!product_id || !qty || qty < 1) {
      return res.status(400).json({ success: false, message: 'Valid product_id and quantity are required.' });
    }

    const product = db.findOne('products', p => p.id === String(product_id));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Selected Product not found.' });
    }

    const existingCoupons = new Set(db.get('coupons').map(c => c.code));
    const prefix = `CF${product.product_code}`;

    // Generate non-confusing unambiguous unique codes
    const generatedCodes = generateBatchCodes({
      prefix,
      length: 6,
      quantity: qty,
      existingCodes
    });

    const batchId = `batch_${Date.now()}`;
    const batchNumber = `BATCH-${new Date().getFullYear()}-${product.product_code}-${Math.floor(100 + Math.random() * 900)}`;

    const newBatch = {
      id: batchId,
      batch_number: batchNumber,
      campaign_id,
      product_id: product.id,
      product_code: product.product_code,
      quantity: qty,
      reward_amount: product.reward_amount,
      created_at: new Date().toISOString()
    };
    db.insert('batches', newBatch);

    const couponItems = generatedCodes.map((code, idx) => ({
      id: `c_${batchId}_${idx + 1}`,
      code,
      batch_id: batchId,
      product_id: product.id,
      reward_amount: product.reward_amount,
      status: 'UNUSED',
      created_at: new Date().toISOString()
    }));

    db.insertMany('coupons', couponItems);

    return res.json({
      success: true,
      batch: newBatch,
      generated_count: couponItems.length,
      sample_codes: generatedCodes.slice(0, 5),
      message: `${qty} unique codes generated successfully for ${product.product_name}!`
    });

  } catch (error) {
    console.error('Create batch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Export Batch CSV for bottle label printing vendor
 */
export async function exportBatchCSV(req, res) {
  try {
    const { batchId } = req.params;
    const batch = db.findOne('batches', b => b.id === batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found.' });
    }

    const product = db.findOne('products', p => p.id === batch.product_id);
    const coupons = db.find('coupons', c => c.batch_id === batchId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${batch.batch_number}_codes.csv"`);

    let csvContent = 'Serial No,Batch Number,Coupon Code,Product Code,Product Name,Pack Size,Reward Amount (INR),Status,Created At\n';

    coupons.forEach((c, index) => {
      csvContent += `${index + 1},"${batch.batch_number}","${c.code}","${product ? product.product_code : ''}","${product ? product.product_name : ''}","${product ? product.pack_size : ''}",${c.reward_amount},"${c.status}","${c.created_at}"\n`;
    });

    return res.send(csvContent);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Coupon Management & Search
 */
export async function getCoupons(req, res) {
  const { status, product_id, search, limit = 100 } = req.query;
  let coupons = db.get('coupons');

  if (status) coupons = coupons.filter(c => c.status === status);
  if (product_id) coupons = coupons.filter(c => c.product_id === product_id);
  if (search) {
    const q = search.trim().toUpperCase();
    coupons = coupons.filter(c => c.code.includes(q));
  }

  const products = db.get('products');
  const enriched = coupons.slice(0, Number(limit)).map(c => {
    const prod = products.find(p => p.id === c.product_id);
    return {
      ...c,
      product_name: prod ? prod.product_name : `Product ${c.product_id}`,
      pack_size: prod ? prod.pack_size : ''
    };
  });

  return res.json({ success: true, count: coupons.length, coupons: enriched });
}

export async function toggleBlockCoupon(req, res) {
  const { code } = req.params;
  const { block } = req.body;

  const coupon = db.findOne('coupons', c => c.code === code);
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

  const newStatus = block ? 'BLOCKED' : 'UNUSED';
  db.update('coupons', c => c.code === code, { status: newStatus });

  return res.json({ success: true, code, status: newStatus, message: `Code ${code} ${block ? 'blocked' : 'unblocked'}.` });
}

/**
 * Redemption & Payout Logs
 */
export async function getRedemptions(req, res) {
  const redemptions = db.get('redemptions');
  return res.json({ success: true, count: redemptions.length, redemptions: redemptions.reverse() });
}

export async function getPayouts(req, res) {
  const payouts = db.get('payouts');
  return res.json({ success: true, count: payouts.length, payouts: payouts.reverse() });
}

/**
 * Admin Action: Manual Payout Override or Retry
 */
export async function retryPayout(req, res) {
  try {
    const { redemptionId } = req.body;
    const redemption = db.findOne('redemptions', r => r.id === redemptionId);
    if (!redemption) return res.status(404).json({ success: false, message: 'Redemption record not found.' });

    const payoutResult = await payoutService.processPayout({
      redemptionId,
      couponCode: redemption.coupon_code,
      amount: redemption.reward_amount,
      upiId: redemption.upi_id,
      mobile: redemption.customer_mobile
    });

    if (payoutResult.status === 'SUCCESS') {
      db.update('coupons', c => c.code === redemption.coupon_code, { status: 'PAID' });
      db.update('redemptions', r => r.id === redemptionId, { status: 'PAID' });
      db.update('payouts', p => p.redemption_id === redemptionId, {
        status: 'SUCCESS',
        utr: payoutResult.utr,
        reference_id: payoutResult.reference_id
      });
    }

    return res.json({ success: true, result: payoutResult });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function manualPay(req, res) {
  try {
    const { redemptionId, customUtr } = req.body;
    if (!customUtr) return res.status(400).json({ success: false, message: 'Enter manual bank UTR reference.' });

    const redemption = db.findOne('redemptions', r => r.id === redemptionId);
    if (!redemption) return res.status(404).json({ success: false, message: 'Redemption not found.' });

    db.update('coupons', c => c.code === redemption.coupon_code, { status: 'PAID' });
    db.update('redemptions', r => r.id === redemptionId, { status: 'PAID' });

    const existingPayout = db.findOne('payouts', p => p.redemption_id === redemptionId);
    if (existingPayout) {
      db.update('payouts', p => p.redemption_id === redemptionId, {
        status: 'SUCCESS',
        utr: customUtr.trim(),
        provider: 'MANUAL_OVERRIDE'
      });
    } else {
      db.insert('payouts', {
        id: `payout_manual_${Date.now()}`,
        redemption_id: redemptionId,
        coupon_code: redemption.coupon_code,
        reward_amount: redemption.reward_amount,
        upi_id: redemption.upi_id,
        provider: 'MANUAL_OVERRIDE',
        reference_id: `MAN-${Date.now()}`,
        utr: customUtr.trim(),
        status: 'SUCCESS',
        created_at: new Date().toISOString()
      });
    }

    return res.json({ success: true, message: `Marked as paid with UTR: ${customUtr}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getFraudLogs(req, res) {
  const logs = db.get('fraud_logs');
  return res.json({ success: true, logs: logs.reverse() });
}
