import React, { useState, useEffect } from 'react';
import {
  fetchAdminStats,
  fetchProducts,
  createProduct,
  updateProductReward,
  fetchBatches,
  createBatch,
  fetchCoupons,
  toggleBlockCoupon,
  fetchRedemptions,
  fetchPayouts,
  retryPayout,
  manualPay,
  fetchFraudLogs
} from '../services/api.js';

import {
  Layers,
  Tag,
  Search,
  Download,
  PlusCircle,
  ShieldAlert,
  CheckCircle,
  DollarSign,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('batches'); // batches | products | coupons | redemptions | fraud
  const [loading, setLoading] = useState(true);

  // Data states
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);

  // Batch Form state
  const [selectedProduct, setSelectedProduct] = useState('31');
  const [batchQty, setBatchQty] = useState('100');
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchMessage, setBatchMessage] = useState('');

  // Product Form state
  const [editRewardId, setEditRewardId] = useState(null);
  const [newRewardVal, setNewRewardVal] = useState('');

  // New Product Form state
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdSize, setNewProdSize] = useState('');
  const [newProdReward, setNewProdReward] = useState('');

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual Pay modal
  const [manualPayRedemptionId, setManualPayRedemptionId] = useState(null);
  const [manualUtr, setManualUtr] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, bRes, cRes, rRes, fRes] = await Promise.all([
        fetchAdminStats(),
        fetchProducts(),
        fetchBatches(),
        fetchCoupons({ limit: 200 }),
        fetchRedemptions(),
        fetchFraudLogs()
      ]);

      if (sRes.success) setStats(sRes.stats);
      if (pRes.success) setProducts(pRes.products);
      if (bRes.success) setBatches(bRes.batches);
      if (cRes.success) setCoupons(cRes.coupons);
      if (rRes.success) setRedemptions(rRes.redemptions);
      if (fRes.success) setFraudLogs(fRes.logs);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Batch Creation
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setBatchCreating(true);
    setBatchMessage('');
    try {
      const res = await createBatch({ product_id: selectedProduct, quantity: Number(batchQty) });
      if (res.success) {
        setBatchMessage(res.message);
        loadAllData();
      } else {
        setBatchMessage('Error: ' + res.message);
      }
    } catch (err) {
      setBatchMessage('Server error during batch creation.');
    } finally {
      setBatchCreating(false);
    }
  };

  // Handle Reward Amount Edit
  const handleSaveReward = async (productId) => {
    if (!newRewardVal) return;
    try {
      const res = await updateProductReward(productId, { reward_amount: Number(newRewardVal) });
      if (res.success) {
        setEditRewardId(null);
        setNewRewardVal('');
        loadAllData();
      }
    } catch (err) {
      alert('Error updating reward');
    }
  };

  // Handle New Product Creation
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await createProduct({
        product_code: newProdCode,
        product_name: newProdName,
        pack_size: newProdSize,
        reward_amount: Number(newProdReward)
      });
      if (res.success) {
        setShowAddProdModal(false);
        setNewProdCode('');
        setNewProdName('');
        setNewProdSize('');
        setNewProdReward('');
        loadAllData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Error creating product');
    }
  };

  // Handle Search & Filter Coupons
  const handleSearchCoupons = async () => {
    const res = await fetchCoupons({ search: searchQuery, status: statusFilter });
    if (res.success) setCoupons(res.coupons);
  };

  // Toggle Block Coupon
  const handleToggleBlock = async (code, currentStatus) => {
    const isBlocked = currentStatus === 'BLOCKED';
    const res = await toggleBlockCoupon(code, !isBlocked);
    if (res.success) loadAllData();
  };

  // Retry Failed Payout
  const handleRetryPayout = async (redemptionId) => {
    try {
      const res = await retryPayout(redemptionId);
      alert(res.result ? res.result.message : 'Retry completed');
      loadAllData();
    } catch (err) {
      alert('Retry error');
    }
  };

  // Manual Pay Override
  const handleSubmitManualPay = async (e) => {
    e.preventDefault();
    if (!manualUtr) return;
    try {
      const res = await manualPay(manualPayRedemptionId, manualUtr);
      if (res.success) {
        setManualPayRedemptionId(null);
        setManualUtr('');
        loadAllData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Manual pay error');
    }
  };

  return (
    <div className="main-wrapper">
      <div className="admin-shell">
        {/* Admin Header */}
        <div className="admin-top-bar">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Credofix Admin & Coupon Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Batch Code Generator • Automated UPI Payout Management • Fraud Prevention</p>
          </div>
          <button
            onClick={loadAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Overview Stats Row */}
        {stats && (
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-box-title">Total Codes</span>
              <span className="stat-box-num text-blue-600">{stats.total_codes}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-title">Unused Codes</span>
              <span className="stat-box-num text-sky-600">{stats.unused}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-title">Redeemed / Paid</span>
              <span className="stat-box-num text-emerald-600">{stats.redeemed}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-title">Total Paid Out</span>
              <span className="stat-box-num text-amber-600">₹{stats.total_payout_amount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-title">Failed / Pending</span>
              <span className="stat-box-num text-rose-600">{stats.failed + stats.pending}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div>
          <div className="admin-tabs-nav">
            <button
              onClick={() => setActiveTab('batches')}
              className={`admin-tab-btn ${activeTab === 'batches' ? 'active' : ''}`}
            >
              <Layers className="w-4 h-4" />
              <span>Batches & Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            >
              <Tag className="w-4 h-4" />
              <span>Products & Rewards</span>
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
            >
              <Search className="w-4 h-4" />
              <span>Coupon Directory</span>
            </button>
            <button
              onClick={() => setActiveTab('redemptions')}
              className={`admin-tab-btn ${activeTab === 'redemptions' ? 'active' : ''}`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Payout Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('fraud')}
              className={`admin-tab-btn ${activeTab === 'fraud' ? 'active' : ''}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Fraud Logs ({fraudLogs.length})</span>
            </button>
          </div>

          {/* TAB 1: BATCH GENERATOR */}
          {activeTab === 'batches' && (
            <div className="table-card">
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Create New Coupon Batch</span>
              </h2>

              <form onSubmit={handleCreateBatch} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="field-label">Select Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="text-field bg-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        Product {p.product_code} ({p.product_name} - ₹{p.reward_amount})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Quantity of Unique Codes</label>
                  <input
                    type="number"
                    value={batchQty}
                    onChange={(e) => setBatchQty(e.target.value)}
                    className="text-field bg-white"
                    min="1"
                    max="50000"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={batchCreating}
                    className="btn-action-primary"
                  >
                    {batchCreating ? 'Generating...' : 'Generate Batch Codes'}
                  </button>
                </div>
              </form>

              {batchMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-xs font-semibold">
                  {batchMessage}
                </div>
              )}

              <h3 className="font-bold text-sm text-slate-800 mt-2">Generated Batches</h3>
              <div className="data-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Batch Number</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Reward</th>
                      <th>Redeemed</th>
                      <th>Created Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id}>
                        <td className="font-mono font-bold text-slate-800">{b.batch_number}</td>
                        <td>{b.product_name}</td>
                        <td>{b.quantity}</td>
                        <td className="font-bold text-emerald-600">₹{b.reward_amount}</td>
                        <td>{b.redeemed_count} / {b.quantity}</td>
                        <td className="text-xs text-slate-500">{new Date(b.created_at).toLocaleDateString()}</td>
                        <td>
                          <a
                            href={`/api/admin/batches/${b.id}/export`}
                            download
                            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded border border-orange-200 hover:bg-orange-100"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS & DYNAMIC REWARDS */}
          {activeTab === 'products' && (
            <div className="table-card">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-500" />
                  <span>Products & Dynamic Cashback Rewards</span>
                </h2>
                <button
                  onClick={() => setShowAddProdModal(true)}
                  className="flex items-center gap-1 text-xs font-bold bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="data-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Product Name</th>
                      <th>Pack Size</th>
                      <th>Current Reward</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td className="font-mono font-bold">{p.product_code}</td>
                        <td className="font-semibold">{p.product_name}</td>
                        <td>{p.pack_size}</td>
                        <td>
                          {editRewardId === p.id ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold">₹</span>
                              <input
                                type="number"
                                value={newRewardVal}
                                onChange={(e) => setNewRewardVal(e.target.value)}
                                className="text-field w-24 py-1"
                                placeholder={p.reward_amount}
                              />
                              <button
                                onClick={() => handleSaveReward(p.id)}
                                className="px-2.5 py-1 bg-emerald-600 text-white text-xs rounded font-bold"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <span className="font-extrabold text-emerald-600 text-base">₹{p.reward_amount}</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge-tag ${p.status === 'active' ? 'badge-paid' : 'badge-blocked'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          {editRewardId !== p.id && (
                            <button
                              onClick={() => { setEditRewardId(p.id); setNewRewardVal(p.reward_amount); }}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Edit Reward
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COUPON DIRECTORY */}
          {activeTab === 'coupons' && (
            <div className="table-card">
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-orange-500" />
                <span>Coupon Directory & Search</span>
              </h2>

              <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input
                  type="text"
                  placeholder="Search Scratch Code (e.g. CF31-K7M9Q2)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-field flex-1 min-w-[200px]"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-field w-40"
                >
                  <option value="">All Statuses</option>
                  <option value="UNUSED">UNUSED</option>
                  <option value="PAID">PAID</option>
                  <option value="PAYOUT_PENDING">PAYOUT_PENDING</option>
                  <option value="PAYOUT_FAILED">PAYOUT_FAILED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
                <button
                  onClick={handleSearchCoupons}
                  className="btn-action-primary w-auto px-5 py-2"
                >
                  Filter
                </button>
              </div>

              <div className="data-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Scratch Code</th>
                      <th>Product</th>
                      <th>Reward</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.id}>
                        <td className="font-mono font-bold text-slate-800">{c.code}</td>
                        <td>Product {c.product_id}</td>
                        <td className="font-bold text-emerald-600">₹{c.reward_amount}</td>
                        <td>
                          <span className={`badge-tag badge-${c.status.toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleToggleBlock(c.code, c.status)}
                            className="text-xs font-bold text-slate-600 hover:text-rose-600"
                          >
                            {c.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PAYOUT LOGS */}
          {activeTab === 'redemptions' && (
            <div className="table-card">
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-500" />
                <span>Redemption History & Payout Transactions</span>
              </h2>

              <div className="data-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Customer Mobile</th>
                      <th>UPI VPA</th>
                      <th>Verified Holder</th>
                      <th>Reward</th>
                      <th>Status</th>
                      <th>Redeemed Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map(r => (
                      <tr key={r.id}>
                        <td className="font-mono font-bold text-slate-800">{r.coupon_code}</td>
                        <td className="font-mono text-slate-700">{r.customer_mobile || 'N/A'}</td>
                        <td className="font-mono font-bold text-blue-700">{r.upi_id}</td>
                        <td className="text-xs font-semibold text-slate-700">{r.verified_name}</td>
                        <td className="font-extrabold text-emerald-600">₹{r.reward_amount}</td>
                        <td>
                          <span className={`badge-tag badge-${r.status.toLowerCase()}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                        <td>
                          {r.status === 'FAILED' ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleRetryPayout(r.id)}
                                className="text-xs px-2 py-1 bg-amber-500 text-white rounded font-bold hover:bg-amber-600"
                              >
                                Retry
                              </button>
                              <button
                                onClick={() => setManualPayRedemptionId(r.id)}
                                className="text-xs px-2 py-1 bg-slate-700 text-white rounded font-bold hover:bg-slate-800"
                              >
                                Manual Pay
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Paid</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FRAUD LOGS */}
          {activeTab === 'fraud' && (
            <div className="table-card">
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Anti-Fraud & Anomaly Logs</span>
              </h2>

              <div className="data-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Type</th>
                      <th>IP Address</th>
                      <th>Attempted Code</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudLogs.map(f => (
                      <tr key={f.id}>
                        <td className="text-xs text-slate-500">{new Date(f.created_at).toLocaleString()}</td>
                        <td className="font-bold text-rose-600">{f.type}</td>
                        <td className="font-mono text-xs">{f.ip}</td>
                        <td className="font-mono font-bold">{f.code || '-'}</td>
                        <td className="text-xs text-slate-700">{f.details}</td>
                      </tr>
                    ))}
                    {fraudLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-slate-400 py-6">
                          No fraud or rate limit violations recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: ADD PRODUCT */}
        {showAddProdModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
              <h3 className="font-bold text-lg text-slate-800">Add New Credofix Product</h3>
              <form onSubmit={handleCreateProduct} className="flex flex-col gap-3">
                <div>
                  <label className="field-label">Product Code (e.g. 34)</label>
                  <input
                    type="text"
                    value={newProdCode}
                    onChange={(e) => setNewProdCode(e.target.value)}
                    className="text-field"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Product Name</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="text-field"
                    placeholder="e.g. Credofix Super Glue 1kg"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Pack Size</label>
                  <input
                    type="text"
                    value={newProdSize}
                    onChange={(e) => setNewProdSize(e.target.value)}
                    className="text-field"
                    placeholder="e.g. 1kg"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Reward Amount (₹)</label>
                  <input
                    type="number"
                    value={newProdReward}
                    onChange={(e) => setNewProdReward(e.target.value)}
                    className="text-field"
                    placeholder="e.g. 50"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProdModal(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-action-primary w-auto px-5 py-2 text-xs"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MANUAL PAY OVERRIDE */}
        {manualPayRedemptionId && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl flex flex-col gap-4">
              <h3 className="font-bold text-lg text-slate-800">Manual Payout Override</h3>
              <p className="text-xs text-slate-600">
                Enter the bank UTR reference number below to mark this redemption as PAID.
              </p>
              <form onSubmit={handleSubmitManualPay} className="flex flex-col gap-3">
                <div>
                  <label className="field-label">Bank UTR Reference Number</label>
                  <input
                    type="text"
                    value={manualUtr}
                    onChange={(e) => setManualUtr(e.target.value)}
                    className="text-field font-mono"
                    placeholder="e.g. UTR98237192301"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setManualPayRedemptionId(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-action-primary w-auto px-5 py-2 text-xs"
                  >
                    Confirm Manual Pay
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
