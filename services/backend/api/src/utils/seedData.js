import bcrypt from 'bcryptjs';
import { User, Product, Supplier, Order, OrderItem, Alert } from '../models/index.js';
import { calculateStockStatus } from '../services/alert.service.js';

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const money = (min, max) => +(min + Math.random() * (max - min)).toFixed(2);
const pastDate = (daysBack = 90) => new Date(Date.now() - Math.random() * daysBack * 86400000);

/* ─────────────────────────────────────────────
   Realistic User Data Pools
   ───────────────────────────────────────────── */
const maleFirstNames = [
  'Ahmed','Mohamed','Omar','Hassan','Ali','Youssef','Khaled','Tarek','Amir','Ziad',
  'Ibrahim','Waleed','Fares','Sami','Nader','Karim','Hesham','Mostafa','Ramy','Sherif',
  'Tamer','Mahmoud','Adel','Bassem','Wael','Hany','Ashraf','Emad','Samir','Gamal',
];
const femaleFirstNames = [
  'Sara','Fatima','Layla','Nour','Mona','Hana','Rania','Dina','Salma','Yasmin',
  'Mariam','Aya','Lina','Reem','Dana','Noha','Amira','Heba','Nada','Mai',
  'Ghada','Rana','Lamia','Farida','Dalia','Sandra','Maha','Doaa','Eman','Abeer',
];
const lastNames = [
  'El-Masry','Hassan','Ali','Ibrahim','Ahmed','Mahmoud','Youssef','Mohamed','Salem','Farouk',
  'Nabil','Osman','Kamal','Rizk','Adel','Saleh','Mansour','Hamdi','Tawfik','Sherif',
  'El-Sayed','Ragab','Abdallah','Darwish','Tantawy','Helmy','Zaki','Barakat','Fathy','Khatab',
];
const departments = ['Operations','Logistics','Warehouse','Procurement','Quality','Distribution'];
const avatarStyles = ['adventurer','avataaars','bottts','micah','miniavs','personas'];

/* ─────────────────────────────────────────────
   Generate a professional email
   ───────────────────────────────────────────── */
const generateEmail = (firstName, lastName, index) => {
  const domain = 'smartinventory.com';
  const patterns = [
    () => `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('el-', '')}@${domain}`,
    () => `${firstName.toLowerCase()[0]}${lastName.toLowerCase().replace('el-', '').replace('-', '')}@${domain}`,
    () => `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('el-', '')}${index}@${domain}`,
  ];
  return patterns[index % patterns.length]();
};

/* ─────────────────────────────────────────────
   Generate avatar URL (DiceBear API)
   ───────────────────────────────────────────── */
const generateAvatar = (seed) => {
  const style = pick(avatarStyles);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
};

/* ─────────────────────────────────────────────
   Generate Egyptian phone number
   ───────────────────────────────────────────── */
const generatePhone = () => {
  const prefixes = ['010', '011', '012', '015'];
  return `+20-${pick(prefixes)}-${rand(1000, 9999)}-${rand(1000, 9999)}`;
};

/* ─────────────────────────────────────────────
   Static Data — Suppliers, Products, etc.
   ───────────────────────────────────────────── */
const companies = [
  'TechVision Inc','GlobalTech Solutions','Apex Electronics','NovaStar Trading',
  'BluePeak Supplies','OmniWare Corp','PrimeLine Industries','SwiftEdge Logistics',
  'CoreTech Distributors','MetroLink Supplies','AlphaWave Electronics','ByteForce Ltd',
  'CircuitPro Inc','DataStream Corp','ElectroMax Trading','FusionTech Co',
  'GigaByte Supplies','HyperNet Solutions','InnovatePro Ltd','JetStream Electronics',
  'KineticParts Inc','LightSpeed Trading','MegaCore Supplies','NexGen Electronics','OptiParts Corp',
];
const streets = [
  '123 Al Tahrir St','456 Corniche Rd','789 Zamalek Ave','321 Maadi Blvd',
  '654 Heliopolis Dr','987 Dokki Square','147 Nasr City Rd','258 6th October Blvd',
  '369 New Cairo Ave','741 Sheikh Zayed Rd',
];
const cities = [
  'Cairo, Egypt','Alexandria, Egypt','Dubai, UAE','Riyadh, KSA','Amman, Jordan',
  'Beirut, Lebanon','Istanbul, Turkey','London, UK','New York, USA','Berlin, Germany',
];

const productTemplates = [
  { name: 'Wireless Headphones Pro', cat: 'Electronics', pMin: 49, pMax: 299 },
  { name: 'Smart Watch Ultra', cat: 'Electronics', pMin: 99, pMax: 499 },
  { name: 'USB-C Hub Adapter 7-in-1', cat: 'Electronics', pMin: 19, pMax: 79 },
  { name: 'Mechanical Keyboard RGB', cat: 'Electronics', pMin: 59, pMax: 199 },
  { name: '4K Webcam Pro', cat: 'Electronics', pMin: 39, pMax: 149 },
  { name: 'Portable SSD 1TB', cat: 'Electronics', pMin: 69, pMax: 179 },
  { name: 'Wireless Earbuds ANC', cat: 'Electronics', pMin: 29, pMax: 199 },
  { name: 'Bluetooth Speaker Waterproof', cat: 'Electronics', pMin: 25, pMax: 129 },
  { name: 'Wireless Charger Pad 15W', cat: 'Electronics', pMin: 12, pMax: 49 },
  { name: 'Gaming Mouse 16000 DPI', cat: 'Electronics', pMin: 29, pMax: 99 },
  { name: 'USB Microphone Studio', cat: 'Electronics', pMin: 39, pMax: 149 },
  { name: 'Noise Cancelling Earphones', cat: 'Electronics', pMin: 49, pMax: 249 },
  { name: 'Portable Power Bank 20000mAh', cat: 'Electronics', pMin: 19, pMax: 59 },
  { name: 'HDMI Splitter 4K', cat: 'Electronics', pMin: 15, pMax: 45 },
  { name: 'Laptop Cooling Pad', cat: 'Electronics', pMin: 19, pMax: 49 },
  { name: 'Smart Pen Digitizer', cat: 'Electronics', pMin: 29, pMax: 89 },
  { name: 'Action Camera 4K', cat: 'Electronics', pMin: 79, pMax: 349 },
  { name: 'E-Reader 6 inch', cat: 'Electronics', pMin: 89, pMax: 199 },
  { name: 'Digital Photo Frame WiFi', cat: 'Electronics', pMin: 49, pMax: 129 },
  { name: 'Car Dash Camera', cat: 'Electronics', pMin: 39, pMax: 149 },
  { name: 'Smart LED Bulb Pack', cat: 'Smart Home', pMin: 19, pMax: 59 },
  { name: 'Robot Vacuum X1', cat: 'Smart Home', pMin: 199, pMax: 699 },
  { name: 'Smart Thermostat Pro', cat: 'Smart Home', pMin: 99, pMax: 249 },
  { name: 'Smart Door Lock Fingerprint', cat: 'Smart Home', pMin: 129, pMax: 349 },
  { name: 'WiFi Security Camera Indoor', cat: 'Smart Home', pMin: 29, pMax: 99 },
  { name: 'Smart Plug 4-Pack', cat: 'Smart Home', pMin: 19, pMax: 49 },
  { name: 'Video Doorbell Pro', cat: 'Smart Home', pMin: 89, pMax: 249 },
  { name: 'Smart Smoke Detector', cat: 'Smart Home', pMin: 29, pMax: 69 },
  { name: 'Smart Curtain Motor', cat: 'Smart Home', pMin: 49, pMax: 129 },
  { name: 'Air Quality Monitor WiFi', cat: 'Smart Home', pMin: 59, pMax: 149 },
  { name: 'Designer Sneakers', cat: 'Fashion', pMin: 49, pMax: 199 },
  { name: 'Leather Messenger Bag', cat: 'Fashion', pMin: 69, pMax: 249 },
  { name: 'Laptop Backpack Anti-Theft', cat: 'Fashion', pMin: 29, pMax: 89 },
  { name: 'Aviator Sunglasses UV400', cat: 'Fashion', pMin: 19, pMax: 79 },
  { name: 'Classic Leather Belt', cat: 'Fashion', pMin: 19, pMax: 69 },
  { name: 'Premium Cotton T-Shirt', cat: 'Fashion', pMin: 12, pMax: 39 },
  { name: 'Canvas Travel Duffel Bag', cat: 'Fashion', pMin: 39, pMax: 119 },
  { name: 'Silk Tie Set Gift Box', cat: 'Fashion', pMin: 29, pMax: 79 },
  { name: 'Wool Beanie Hat', cat: 'Fashion', pMin: 9, pMax: 29 },
  { name: 'Rain Jacket Waterproof', cat: 'Fashion', pMin: 39, pMax: 129 },
  { name: 'Organic Coffee Beans 1kg', cat: 'Food & Beverage', pMin: 12, pMax: 39 },
  { name: 'Protein Powder Vanilla 2lb', cat: 'Food & Beverage', pMin: 24, pMax: 59 },
  { name: 'Green Tea Box 100ct', cat: 'Food & Beverage', pMin: 6, pMax: 19 },
  { name: 'Premium Olive Oil 1L', cat: 'Food & Beverage', pMin: 9, pMax: 29 },
  { name: 'Organic Honey Raw 500g', cat: 'Food & Beverage', pMin: 8, pMax: 24 },
  { name: 'Dark Chocolate Gift Box', cat: 'Food & Beverage', pMin: 14, pMax: 39 },
  { name: 'Mixed Nuts Premium 1kg', cat: 'Food & Beverage', pMin: 12, pMax: 34 },
  { name: 'Matcha Powder Ceremonial', cat: 'Food & Beverage', pMin: 19, pMax: 49 },
  { name: 'Ergonomic Office Chair', cat: 'Furniture', pMin: 149, pMax: 599 },
  { name: 'Standing Desk Electric', cat: 'Furniture', pMin: 249, pMax: 799 },
  { name: 'Monitor Stand Wooden', cat: 'Furniture', pMin: 29, pMax: 89 },
  { name: 'Desk Lamp LED Touch', cat: 'Furniture', pMin: 19, pMax: 59 },
  { name: 'Bookshelf 5-Tier', cat: 'Furniture', pMin: 49, pMax: 149 },
  { name: 'Filing Cabinet 3-Drawer', cat: 'Furniture', pMin: 79, pMax: 199 },
  { name: 'Under Desk Drawer Organizer', cat: 'Furniture', pMin: 24, pMax: 59 },
  { name: 'Cable Management Box', cat: 'Furniture', pMin: 12, pMax: 34 },
  { name: 'Yoga Mat Premium TPE', cat: 'Sports', pMin: 19, pMax: 49 },
  { name: 'Resistance Bands Set 5-Level', cat: 'Sports', pMin: 9, pMax: 29 },
  { name: 'Camping Tent 4-Person', cat: 'Sports', pMin: 79, pMax: 249 },
  { name: 'Adjustable Dumbbell Set', cat: 'Sports', pMin: 99, pMax: 349 },
  { name: 'Jump Rope Speed', cat: 'Sports', pMin: 8, pMax: 24 },
  { name: 'Foam Roller Muscle Recovery', cat: 'Sports', pMin: 14, pMax: 39 },
  { name: 'Running Belt Waist Pack', cat: 'Sports', pMin: 9, pMax: 29 },
  { name: 'Hiking Backpack 40L', cat: 'Sports', pMin: 39, pMax: 119 },
  { name: 'Espresso Machine Semi-Auto', cat: 'Appliances', pMin: 149, pMax: 449 },
  { name: 'Air Fryer Digital 5.5L', cat: 'Appliances', pMin: 49, pMax: 149 },
  { name: 'Air Purifier HEPA Large', cat: 'Appliances', pMin: 99, pMax: 299 },
  { name: 'Blender High-Speed 1200W', cat: 'Appliances', pMin: 39, pMax: 129 },
  { name: 'Electric Kettle Gooseneck', cat: 'Appliances', pMin: 29, pMax: 79 },
  { name: 'Toaster Oven Convection', cat: 'Appliances', pMin: 49, pMax: 149 },
  { name: 'Bread Maker Automatic', cat: 'Appliances', pMin: 69, pMax: 199 },
  { name: 'Handheld Vacuum Cordless', cat: 'Appliances', pMin: 39, pMax: 119 },
  { name: 'Car Phone Mount Magnetic', cat: 'Automotive', pMin: 9, pMax: 29 },
  { name: 'Car Vacuum Portable', cat: 'Automotive', pMin: 24, pMax: 69 },
  { name: 'Tire Inflator Portable', cat: 'Automotive', pMin: 29, pMax: 79 },
  { name: 'LED Headlight Bulb Kit', cat: 'Automotive', pMin: 19, pMax: 59 },
  { name: 'Car Seat Cover Set', cat: 'Automotive', pMin: 29, pMax: 89 },
  { name: 'Electric Toothbrush Sonic', cat: 'Health & Beauty', pMin: 29, pMax: 89 },
  { name: 'Hair Dryer Ionic Pro', cat: 'Health & Beauty', pMin: 29, pMax: 99 },
  { name: 'Facial Cleansing Brush', cat: 'Health & Beauty', pMin: 19, pMax: 59 },
  { name: 'Essential Oil Diffuser', cat: 'Health & Beauty', pMin: 14, pMax: 49 },
  { name: 'Digital Scale Bluetooth', cat: 'Health & Beauty', pMin: 19, pMax: 49 },
  { name: 'Whiteboard Magnetic 90x60', cat: 'Office Supplies', pMin: 29, pMax: 89 },
  { name: 'Label Maker Bluetooth', cat: 'Office Supplies', pMin: 19, pMax: 59 },
  { name: 'Paper Shredder Cross-Cut', cat: 'Office Supplies', pMin: 39, pMax: 129 },
  { name: 'Desk Organizer Bamboo', cat: 'Office Supplies', pMin: 14, pMax: 39 },
  { name: 'Gel Pen Set 24-Colors', cat: 'Office Supplies', pMin: 6, pMax: 19 },
  { name: 'Building Blocks 1000pcs', cat: 'Toys & Games', pMin: 19, pMax: 49 },
  { name: 'RC Drone Camera HD', cat: 'Toys & Games', pMin: 49, pMax: 199 },
  { name: 'Board Game Strategy Set', cat: 'Toys & Games', pMin: 19, pMax: 49 },
  { name: 'Puzzle 1000 Pieces', cat: 'Toys & Games', pMin: 9, pMax: 24 },
  { name: 'Solar Garden Lights 10-Pack', cat: 'Garden & Outdoor', pMin: 19, pMax: 49 },
  { name: 'Pruning Shears Professional', cat: 'Garden & Outdoor', pMin: 12, pMax: 34 },
  { name: 'Hammock Double with Stand', cat: 'Garden & Outdoor', pMin: 49, pMax: 149 },
  { name: 'BBQ Grill Portable Charcoal', cat: 'Garden & Outdoor', pMin: 39, pMax: 119 },
];

const productImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100&h=100&fit=crop',
];

/* ─────────────────────────────────────────────
   50 Users — Fully-Populated
   ───────────────────────────────────────────── */
const UNIFIED_PASSWORD = '123456';

/**
 * Role Distribution (strict):
 *  - 3 Owners
 *  - 10 Managers
 *  - 7 Security
 *  - 30 Staff
 *  Total = 50
 */
const userBlueprints = [];

// ── 3 Owners (manually defined for stability) ──
const ownerData = [
  { first: 'Ahmed',  last: 'El-Masry',  gender: 'm' },
  { first: 'Sara',   last: 'Hassan',     gender: 'f' },
  { first: 'Mohamed', last: 'Ibrahim',   gender: 'm' },
];
ownerData.forEach((o, i) => {
  userBlueprints.push({
    name: `${o.first} ${o.last}`,
    email: generateEmail(o.first, o.last, i),
    role: 'owner',
    phone: generatePhone(),
    avatar: generateAvatar(`${o.first}-${o.last}`),
  });
});

// ── 10 Managers ──
for (let i = 0; i < 10; i++) {
  const isMale = i % 2 === 0;
  const first = isMale ? maleFirstNames[3 + i] : femaleFirstNames[3 + i];
  const last = lastNames[5 + i];
  userBlueprints.push({
    name: `${first} ${last}`,
    email: generateEmail(first, last, i + 3),
    role: 'manager',
    phone: generatePhone(),
    avatar: generateAvatar(`${first}-${last}`),
  });
}

// ── 7 Security ──
for (let i = 0; i < 7; i++) {
  const isMale = i % 2 === 0;
  const first = isMale ? maleFirstNames[13 + i] : femaleFirstNames[13 + i];
  const last = lastNames[15 + i];
  userBlueprints.push({
    name: `${first} ${last}`,
    email: generateEmail(first, last, i + 13),
    role: 'security',
    phone: generatePhone(),
    avatar: generateAvatar(`${first}-${last}`),
  });
}

// ── 30 Staff ──
for (let i = 0; i < 30; i++) {
  const isMale = i % 2 === 0;
  const first = isMale
    ? maleFirstNames[i % maleFirstNames.length]
    : femaleFirstNames[i % femaleFirstNames.length];
  const last = lastNames[(i + 7) % lastNames.length];
  userBlueprints.push({
    name: `${first} ${last}`,
    email: generateEmail(first, last, i + 20),
    role: 'staff',
    phone: generatePhone(),
    avatar: generateAvatar(`staff-${first}-${last}-${i}`),
  });
}

/* ─────────────────────────────────────────────
   Main Seeder
   ───────────────────────────────────────────── */
export const seedDatabase = async () => {
  // Proceed with seeding regardless of existing count (controlled by the wrapper)
  console.log('🌱 Starting database seeding process...');

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     🌱  Smart Inventory — Database Seeder       ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  const t0 = Date.now();
  const hashed = await bcrypt.hash(UNIFIED_PASSWORD, 12);

  // ── Ensure unique emails ──
  const usedEmails = new Set();
  const uniqueBlueprints = userBlueprints.map((bp, idx) => {
    let email = bp.email;
    if (usedEmails.has(email)) {
      email = `user${idx}@smartinventory.com`;
    }
    usedEmails.add(email);
    return { ...bp, email };
  });

  // ── Create 50 Users ──
  console.log('👥 Creating 50 users...');
  const createdUsers = [];
  for (const bp of uniqueBlueprints) {
    const user = await User.create({
      name: bp.name,
      email: bp.email,
      password: hashed,
      role: bp.role,
      phone: bp.phone,
      avatar: bp.avatar,
    });
    createdUsers.push(user);
  }

  // ── Suppliers ──
  console.log('🏢 Creating 25 suppliers...');
  const suppliers = [];
  for (let i = 0; i < 25; i++) {
    const company = companies[i];
    const fn = pick(maleFirstNames);
    const ln = pick(lastNames);
    const supplier = await Supplier.create({
      name: `${fn} ${ln}`,
      email: `orders@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: generatePhone(),
      address: `${pick(streets)}, ${pick(cities)}`,
      company,
      status: Math.random() > 0.15 ? 'active' : 'inactive',
    });
    suppliers.push(supplier);
  }

  // ── Products (96 products) ──
  console.log('📦 Creating products...');
  const products = [];
  for (let i = 0; i < productTemplates.length; i++) {
    const tmpl = productTemplates[i];
    const sku = `SKU-${String(i + 1).padStart(4, '0')}`;
    const quantity = pick([0, 0, rand(1, 5), rand(1, 5), rand(6, 30), rand(30, 100), rand(100, 500), rand(500, 2000)]);
    const minStock = pick([5, 10, 15, 20, 25, 30, 40, 50, 75, 100]);
    const maxStock = minStock * pick([10, 15, 20, 30]);
    const status = calculateStockStatus(quantity, minStock, maxStock);

    const product = await Product.create({
      name: tmpl.name,
      sku,
      description: `High quality ${tmpl.name.toLowerCase()} — premium grade, fully tested and certified.`,
      category: tmpl.cat,
      price: money(tmpl.pMin, tmpl.pMax),
      image: productImages[i % productImages.length],
      supplierId: pick(suppliers).id,
      minStock,
      maxStock,
      quantity,
      status,
      lastUpdated: pastDate(60),
    });
    products.push(product);
  }

  // ── Orders (80) ──
  console.log('📋 Creating 80 orders...');
  const orderStatuses = ['pending', 'processing', 'completed', 'completed', 'completed', 'completed', 'cancelled'];
  const allOrders = [];
  for (let i = 0; i < 80; i++) {
    const type = Math.random() > 0.4 ? 'purchase' : 'sale';
    const sup = pick(suppliers);
    const numItems = rand(1, 5);
    const selectedProducts = [];
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(pick(products));
    }

    let totalAmount = 0;
    const items = selectedProducts.map(p => {
      const qty = rand(1, 30);
      const price = parseFloat(p.price);
      totalAmount += price * qty;
      return { productId: p.id, quantity: qty, price };
    });

    const orderDate = pastDate(90);
    const order = await Order.create({
      orderNumber: `ORD-${String(2024000 + i).padStart(7, '0')}`,
      supplierId: sup.id,
      type,
      status: pick(orderStatuses),
      totalAmount: totalAmount.toFixed(2),
      createdAt: orderDate,
      updatedAt: orderDate,
    });

    for (const item of items) {
      await OrderItem.create({ orderId: order.id, ...item });
    }
    allOrders.push(order);
  }

  // ── Alerts ──
  console.log('🔔 Generating alerts...');
  for (const product of products) {
    if (product.status !== 'in_stock') {
      const typeMap = {
        out_of_stock: { severity: 'critical', msg: `${product.name} is OUT OF STOCK — immediate reorder needed` },
        low_stock: { severity: 'warning', msg: `${product.name} is running low (${product.quantity} remaining, min: ${product.minStock})` },
        overstock: { severity: 'info', msg: `${product.name} is overstocked (${product.quantity} units, max: ${product.maxStock})` },
      };
      const config = typeMap[product.status];
      if (config) {
        await Alert.create({
          productId: product.id,
          type: product.status,
          message: config.msg,
          severity: config.severity,
          isRead: Math.random() > 0.6,
          createdAt: pastDate(30),
        });
      }
    }
  }

  for (let i = 0; i < 20; i++) {
    const p = pick(products);
    const alertTemplates = [
      { type: 'low_stock', severity: 'warning', msg: `Reorder point reached for ${p.name} — only ${p.quantity} units left` },
      { type: 'out_of_stock', severity: 'critical', msg: `URGENT: ${p.name} stock depleted. Customer orders may be affected.` },
      { type: 'overstock', severity: 'info', msg: `Warehouse alert: ${p.name} exceeds max capacity (${p.quantity}/${p.maxStock})` },
    ];
    const tmpl = pick(alertTemplates);
    await Alert.create({
      productId: p.id,
      type: tmpl.type,
      message: tmpl.msg,
      severity: tmpl.severity,
      isRead: Math.random() > 0.5,
      createdAt: pastDate(14),
    });
  }

  /* ─────────────────────────────────────────────
     Summary & Credentials Table
     ───────────────────────────────────────────── */
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Count by role
  const roleCounts = { owner: 0, manager: 0, security: 0, staff: 0 };
  createdUsers.forEach(u => { roleCounts[u.role]++; });

  console.log('');
  console.log(`✅ Database seeded successfully in ${elapsed}s!`);
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║              📊  Seed Summary                   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  👥 Users:     ${String(createdUsers.length).padEnd(5)} (${roleCounts.owner} owners, ${roleCounts.manager} managers, ${roleCounts.security} security, ${roleCounts.staff} staff)`);
  console.log(`║  📦 Products:  ${String(products.length).padEnd(5)}`);
  console.log(`║  🏢 Suppliers: ${String(suppliers.length).padEnd(5)}`);
  console.log(`║  📋 Orders:    ${String(allOrders.length).padEnd(5)}`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ── Print Login Credentials Table ──
  const sampleUsers = [];
  // Pick all 3 owners
  sampleUsers.push(...createdUsers.filter(u => u.role === 'owner'));
  // Pick 1 manager, 1 security, 1 staff
  sampleUsers.push(createdUsers.find(u => u.role === 'manager'));
  sampleUsers.push(createdUsers.find(u => u.role === 'security'));
  sampleUsers.push(createdUsers.find(u => u.role === 'staff'));

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🔑  Login Credentials                            ║');
  console.log('╠═══════════════╦═══════════════════════════════════════╦══════════════╣');
  console.log('║  Role         ║  Email                                ║  Password    ║');
  console.log('╠═══════════════╬═══════════════════════════════════════╬══════════════╣');

  for (const u of sampleUsers) {
    const role = u.role.toUpperCase().padEnd(12);
    const email = u.email.padEnd(36);
    console.log(`║  ${role} ║  ${email} ║  ${UNIFIED_PASSWORD}       ║`);
  }

  console.log('╚═══════════════╩═══════════════════════════════════════╩══════════════╝');
  console.log('');
  console.log('💡 All 50 users share the same password: ' + UNIFIED_PASSWORD);
  console.log('');
};

