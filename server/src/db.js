import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '../data/db.json');

// Ensure data folder exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed template
const initialData = {
  products: [
    {
      id: "31",
      product_code: "31",
      product_name: "Credofix Gel Glue (125g)",
      pack_size: "125g",
      reward_amount: 10,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "32",
      product_code: "32",
      product_name: "Credofix Gel Glue (250g)",
      pack_size: "250g",
      reward_amount: 15,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "33",
      product_code: "33",
      product_name: "Credofix Heavy Duty Adhesive (500g)",
      pack_size: "500g",
      reward_amount: 25,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  campaigns: [
    {
      id: "camp_001",
      campaign_name: "Credofix Cashback Dhamaka 2026",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      status: "active",
      total_budget: 500000,
      created_at: new Date().toISOString()
    }
  ],
  batches: [
    {
      id: "batch_101",
      batch_number: "BATCH-2026-31-01",
      campaign_id: "camp_001",
      product_id: "31",
      product_code: "31",
      quantity: 10,
      reward_amount: 10,
      created_at: new Date().toISOString()
    },
    {
      id: "batch_102",
      batch_number: "BATCH-2026-32-01",
      campaign_id: "camp_001",
      product_id: "32",
      product_code: "32",
      quantity: 10,
      reward_amount: 15,
      created_at: new Date().toISOString()
    }
  ],
  coupons: [
    // Pre-generated active codes for immediate testing
    {
      id: "c_1001",
      code: "CF31-K7M9Q2",
      batch_id: "batch_101",
      product_id: "31",
      reward_amount: 10,
      status: "UNUSED", // UNUSED | REDEEMED | PAYOUT_PENDING | PAID | BLOCKED | PAYOUT_FAILED
      created_at: new Date().toISOString()
    },
    {
      id: "c_1002",
      code: "CF31-P8X4L7",
      batch_id: "batch_101",
      product_id: "31",
      reward_amount: 10,
      status: "UNUSED",
      created_at: new Date().toISOString()
    },
    {
      id: "c_1003",
      code: "CF31-X5T9L3",
      batch_id: "batch_101",
      product_id: "31",
      reward_amount: 10,
      status: "UNUSED",
      created_at: new Date().toISOString()
    },
    {
      id: "c_1004",
      code: "CF31-DEMO10",
      batch_id: "batch_101",
      product_id: "31",
      reward_amount: 10,
      status: "UNUSED",
      created_at: new Date().toISOString()
    },
    {
      id: "c_2001",
      code: "CF32-M5R8T2",
      batch_id: "batch_102",
      product_id: "32",
      reward_amount: 15,
      status: "UNUSED",
      created_at: new Date().toISOString()
    },
    {
      id: "c_2002",
      code: "CF32-Q7N4K9",
      batch_id: "batch_102",
      product_id: "32",
      reward_amount: 15,
      status: "UNUSED",
      created_at: new Date().toISOString()
    },
    {
      id: "c_2003",
      code: "CF32-DEMO15",
      batch_id: "batch_102",
      product_id: "32",
      reward_amount: 15,
      status: "UNUSED",
      created_at: new Date().toISOString()
    },
    // Demo used code
    {
      id: "c_9001",
      code: "CF31-USED01",
      batch_id: "batch_101",
      product_id: "31",
      reward_amount: 10,
      status: "PAID",
      redeemed_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  redemptions: [
    {
      id: "red_9001",
      coupon_id: "c_9001",
      coupon_code: "CF31-USED01",
      product_id: "31",
      product_name: "Credofix Gel Glue (125g)",
      reward_amount: 10,
      customer_mobile: "9876543210",
      upi_id: "rahul@upi",
      verified_name: "Rahul Kumar",
      ip_address: "127.0.0.1",
      device_id: "dev_browser_hash",
      status: "PAID",
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  payouts: [
    {
      id: "payout_9001",
      redemption_id: "red_9001",
      coupon_code: "CF31-USED01",
      reward_amount: 10,
      upi_id: "rahul@upi",
      provider: "RazorpayX_Mock",
      reference_id: "REF-983172101",
      utr: "UTR-88237192301",
      status: "SUCCESS",
      failure_reason: null,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  fraud_logs: []
};

class Database {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = initialData;
        this.save();
      }
    } catch (err) {
      console.error('Error loading DB file, resetting to initial seed:', err);
      this.data = initialData;
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB file:', err);
    }
  }

  get(collectionName) {
    return this.data[collectionName] || [];
  }

  find(collectionName, predicate) {
    const coll = this.get(collectionName);
    return coll.filter(predicate);
  }

  findOne(collectionName, predicate) {
    const coll = this.get(collectionName);
    return coll.find(predicate);
  }

  insert(collectionName, item) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    this.data[collectionName].push(item);
    this.save();
    return item;
  }

  insertMany(collectionName, items) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    this.data[collectionName].push(...items);
    this.save();
    return items;
  }

  update(collectionName, predicate, updates) {
    const coll = this.get(collectionName);
    let updatedCount = 0;
    for (let i = 0; i < coll.length; i++) {
      if (predicate(coll[i])) {
        coll[i] = { ...coll[i], ...updates, updated_at: new Date().toISOString() };
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      this.save();
    }
    return updatedCount;
  }
}

export const db = new Database();
