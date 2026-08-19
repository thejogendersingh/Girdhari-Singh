// Mock backend for frontend-only deployment
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource.url;

  if (url.includes('/api/')) {
    // Artificial delay
    await new Promise(r => setTimeout(r, 1000));

    if (url.includes('/coupons/validate')) {
      return new Response(JSON.stringify({ valid: true, amount: 20, product_name: 'Adhesive 500g (Mock)' }), { status: 200 });
    }

    if (url.includes('/coupons/redeem')) {
      return new Response(JSON.stringify({ success: true, amount: 20, utr: 'MOCK' + Math.floor(Math.random()*1000000000) }), { status: 200 });
    }

    if (url.includes('/admin/stats')) {
      return new Response(JSON.stringify({
        totalRedeemed: 1540,
        totalAmount: 30800,
        fraudAttempts: 12
      }), { status: 200 });
    }

    if (url.includes('/admin/products')) {
      if (config && config.method === 'POST') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify([
        { id: 1, name: 'Adhesive 500g', reward_amount: 20 },
        { id: 2, name: 'Adhesive 1Kg', reward_amount: 50 }
      ]), { status: 200 });
    }

    if (url.includes('/admin/batches')) {
      if (config && config.method === 'POST') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }

    if (url.includes('/admin/coupons')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    if (url.includes('/admin/redemptions')) {
      return new Response(JSON.stringify([
        { id: 1, upi_id: 'user@ybl', mobile: '9999999999', amount: 20, status: 'SUCCESS', created_at: new Date().toISOString() }
      ]), { status: 200 });
    }

    if (url.includes('/admin/payouts')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    if (url.includes('/admin/fraud-logs')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return originalFetch(...args);
};
