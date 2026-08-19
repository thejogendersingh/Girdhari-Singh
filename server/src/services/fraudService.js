import { db } from '../db.js';

export class FraudService {
  /**
   * Check if UPI or Mobile exceeds daily redemption threshold
   */
  checkLimits({ mobile, upiId, maxDaily = 5 }) {
    const today = new Date().toISOString().split('T')[0];
    const redemptions = db.get('redemptions');

    const countToday = redemptions.filter(r => {
      const isToday = r.created_at && r.created_at.startsWith(today);
      const isSameMobile = mobile && r.customer_mobile === mobile;
      const isSameUPI = upiId && r.upi_id === upiId;
      return isToday && (isSameMobile || isSameUPI);
    }).length;

    if (countToday >= maxDaily) {
      return {
        allowed: false,
        reason: `इस मोबाइल / UPI नंबर से आज की अधिकतम लिमिट (${maxDaily}) पूरी हो चुकी है।`
      };
    }

    return { allowed: true };
  }

  /**
   * Log potential fraudulent activity
   */
  logSuspiciousActivity({ type, ip, mobile, code, details }) {
    const logItem = {
      id: `fraud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      ip,
      mobile,
      code,
      details,
      created_at: new Date().toISOString()
    };
    db.insert('fraud_logs', logItem);
    console.warn('[SECURITY ALERT]', logItem);
    return logItem;
  }
}

export const fraudService = new FraudService();
