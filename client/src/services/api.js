const API_BASE = '/api';

export async function validateCoupon(code) {
  const res = await fetch(`${API_BASE}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  return res.json();
}

export async function redeemCoupon({ code, upi_id, mobile }) {
  const res = await fetch(`${API_BASE}/coupons/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, upi_id, mobile, device_id: navigator.userAgent })
  });
  return res.json();
}

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/admin/stats`);
  return res.json();
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/admin/products`);
  return res.json();
}

export async function createProduct(productData) {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  return res.json();
}

export async function updateProductReward(id, data) {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchBatches() {
  const res = await fetch(`${API_BASE}/admin/batches`);
  return res.json();
}

export async function createBatch({ product_id, quantity }) {
  const res = await fetch(`${API_BASE}/admin/batches/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id, quantity })
  });
  return res.json();
}

export async function fetchCoupons({ status, product_id, search }) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (product_id) params.append('product_id', product_id);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/admin/coupons?${params.toString()}`);
  return res.json();
}

export async function toggleBlockCoupon(code, block) {
  const res = await fetch(`${API_BASE}/admin/coupons/${code}/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ block })
  });
  return res.json();
}

export async function fetchRedemptions() {
  const res = await fetch(`${API_BASE}/admin/redemptions`);
  return res.json();
}

export async function fetchPayouts() {
  const res = await fetch(`${API_BASE}/admin/payouts`);
  return res.json();
}

export async function retryPayout(redemptionId) {
  const res = await fetch(`${API_BASE}/admin/payouts/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redemptionId })
  });
  return res.json();
}

export async function manualPay(redemptionId, customUtr) {
  const res = await fetch(`${API_BASE}/admin/payouts/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redemptionId, customUtr })
  });
  return res.json();
}

export async function fetchFraudLogs() {
  const res = await fetch(`${API_BASE}/admin/fraud-logs`);
  return res.json();
}
