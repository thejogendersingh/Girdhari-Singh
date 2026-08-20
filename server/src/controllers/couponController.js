import { db } from '../db.js';
import { sanitizeCodeInput } from '../services/codeGenerator.js';
import { payoutService } from '../services/payoutService.js';
import { fraudService } from '../services/fraudService.js';

/**
 * Validate customer scratch code
 */
export async function validateCoupon(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'कृपया 8-digit का coupon code दर्ज करें।'
      });
    }

    const cleanedCode = sanitizeCodeInput(code);

    // Find coupon in DB
    let coupon = db.findOne('coupons', c => c.code === cleanedCode);

    // TEMPORARY MOCK FOR TESTING: IF code is exactly 8 chars and not found, auto-create it!
    if (!coupon && cleanedCode.length === 8) {
      const mockProduct = db.findOne('products', p => p.id === '31');
      if (mockProduct) {
        db.insert('coupons', {
          id: `c_mock_${Date.now()}`,
          code: cleanedCode,
          batch_id: "batch_101",
          product_id: "31",
          reward_amount: mockProduct.reward_amount,
          status: "UNUSED",
          created_at: new Date().toISOString()
        });
        // Re-fetch the newly created coupon
        coupon = db.findOne('coupons', c => c.code === cleanedCode);
      }
    }

    if (!coupon) {
      fraudService.logSuspiciousActivity({
        type: 'INVALID_CODE_ATTEMPT',
        ip: req.ip,
        code: cleanedCode,
        details: 'Code not found in database'
      });
      return res.status(404).json({
        success: false,
        valid: false,
        code_status: 'INVALID',
        message: 'यह कोड सही नहीं है। कृपया scratch card पर दिया गया code दोबारा जांचें।'
      });
    }

    if (coupon.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        valid: false,
        code_status: 'BLOCKED',
        message: 'यह कोड अमान्य अथवा block कर दिया गया है।'
      });
    }

    if (coupon.status === 'PAID' || coupon.status === 'REDEEMED' || coupon.status === 'PAYOUT_PENDING') {
      return res.status(400).json({
        success: false,
        valid: false,
        code_status: coupon.status,
        message: 'यह कोड पहले ही इस्तेमाल हो चुका है।'
      });
    }

    if (coupon.status !== 'UNUSED') {
      return res.status(400).json({
        success: false,
        valid: false,
        code_status: coupon.status,
        message: `यह कोड redemption के लिए उपलब्ध नहीं है (${coupon.status})।`
      });
    }

    // Fetch Product Details from DB to ensure reward amount cannot be altered
    const product = db.findOne('products', p => p.id === coupon.product_id);

    if (!product || product.status !== 'active') {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'इस product के लिए offer फिलहाल उपलब्ध नहीं है।'
      });
    }

    return res.json({
      success: true,
      valid: true,
      code_status: 'UNUSED',
      coupon: {
        code: coupon.code,
        product_id: product.id,
        product_name: product.product_name,
        pack_size: product.pack_size,
        reward_amount: product.reward_amount
      },
      message: `बधाई हो! आपको ${product.pack_size} Pack पर ₹${product.reward_amount} का Cashback मिलेगा।`
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server internal error during code validation.'
    });
  }
}

/**
 * Redeem code & process instant automated UPI payout
 */
export async function redeemCoupon(req, res) {
  try {
    const { code, upi_id, mobile, device_id } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!code || !upi_id) {
      return res.status(400).json({
        success: false,
        message: 'कृपया Scratch Code और UPI ID दोनों दर्ज करें।'
      });
    }

    const cleanedCode = sanitizeCodeInput(code);
    const cleanedUpi = upi_id.trim();
    const cleanedMobile = mobile ? mobile.trim() : '';

    // 1. Double check coupon existence & state
    const coupon = db.findOne('coupons', c => c.code === cleanedCode);
    if (!coupon || coupon.status !== 'UNUSED') {
      return res.status(400).json({
        success: false,
        message: coupon ? 'यह कोड पहले ही इस्तेमाल हो चुका है।' : 'अमान्य कोड।'
      });
    }

    // 2. Fraud Limit check
    const limitCheck = fraudService.checkLimits({ mobile: cleanedMobile, upiId: cleanedUpi, maxDaily: 5 });
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: limitCheck.reason
      });
    }

    // 3. Verify UPI ID
    const upiVerification = await payoutService.verifyUPI(cleanedUpi);
    if (!upiVerification.valid) {
      return res.status(400).json({
        success: false,
        message: upiVerification.message
      });
    }

    // 4. Fetch reward from Product DB
    const product = db.findOne('products', p => p.id === coupon.product_id);
    const rewardAmount = product ? product.reward_amount : coupon.reward_amount;

    // 5. Atomic state update to PAYOUT_PENDING
    db.update('coupons', c => c.code === cleanedCode, {
      status: 'PAYOUT_PENDING',
      redeemed_at: new Date().toISOString()
    });

    // 6. Create Redemption record
    const redemptionId = `red_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const redemptionRecord = {
      id: redemptionId,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      product_id: coupon.product_id,
      product_name: product ? product.product_name : 'Credofix Gel Glue',
      reward_amount: rewardAmount,
      customer_mobile: cleanedMobile,
      upi_id: cleanedUpi,
      verified_name: upiVerification.account_holder_name || 'Credofix Customer',
      ip_address: ip,
      device_id: device_id || 'browser',
      status: 'PAYOUT_PENDING',
      created_at: new Date().toISOString()
    };
    db.insert('redemptions', redemptionRecord);

    // 7. Execute Payout API
    const payoutResult = await payoutService.processPayout({
      redemptionId,
      couponCode: coupon.code,
      amount: rewardAmount,
      upiId: cleanedUpi,
      mobile: cleanedMobile
    });

    const payoutId = `payout_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const payoutRecord = {
      id: payoutId,
      redemption_id: redemptionId,
      coupon_code: coupon.code,
      reward_amount: rewardAmount,
      upi_id: cleanedUpi,
      provider: payoutResult.provider,
      reference_id: payoutResult.reference_id,
      utr: payoutResult.utr || null,
      status: payoutResult.status,
      failure_reason: payoutResult.failure_reason || null,
      created_at: new Date().toISOString()
    };
    db.insert('payouts', payoutRecord);

    // 8. Update Final Statuses
    if (payoutResult.status === 'SUCCESS') {
      db.update('coupons', c => c.code === cleanedCode, { status: 'PAID' });
      db.update('redemptions', r => r.id === redemptionId, { status: 'PAID' });
    } else if (payoutResult.status === 'FAILED') {
      db.update('coupons', c => c.code === cleanedCode, { status: 'PAYOUT_FAILED' });
      db.update('redemptions', r => r.id === redemptionId, { status: 'FAILED' });
    }

    return res.json({
      success: payoutResult.success,
      status: payoutResult.status,
      redemption: {
        transaction_id: redemptionId,
        reference_id: payoutResult.reference_id,
        utr: payoutResult.utr || 'PROCESSING',
        reward_amount: rewardAmount,
        upi_id: cleanedUpi,
        verified_name: upiVerification.account_holder_name,
        product_name: product ? product.product_name : 'Credofix Glue'
      },
      message: payoutResult.message || `₹${rewardAmount} का reward आपके UPI ID ${cleanedUpi} पर भेज दिया गया है!`
    });

  } catch (error) {
    console.error('Redeem coupon error:', error);
    return res.status(500).json({
      success: false,
      message: 'Redemption process में त्रुटि हुई। कृपया थोड़ी देर बाद प्रयास करें।'
    });
  }
}
