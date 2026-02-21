const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'susvada.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initializeDb(db);
    }
    return db;
}

function initializeDb(database) {
    database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT DEFAULT 'Home',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      country TEXT DEFAULT 'India',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      compare_price REAL,
      weight TEXT,
      unit TEXT DEFAULT 'g',
      shelf_life_days INTEGER DEFAULT 30,
      manufactured_date TEXT,
      is_preorder INTEGER DEFAULT 0,
      preorder_date TEXT,
      stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'draft')),
      hero_image TEXT,
      images TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending_verification' CHECK(status IN ('pending_verification', 'processing', 'shipped', 'delivered', 'cancelled')),
      utr TEXT,
      delivery_date TEXT,
      address TEXT NOT NULL,
      notes TEXT,
      telegram_message_id TEXT,
      cancel_reason TEXT,
      refund_status TEXT DEFAULT 'none' CHECK(refund_status IN ('none', 'pending', 'processed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      percentage INTEGER NOT NULL,
      payment_details TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed')),
      processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(order_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
  `);

    // Seed default settings if not exist
    const insertSetting = database.prepare(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
    );
    insertSetting.run('min_free_delivery', '500');
    insertSetting.run('domestic_shipping', '60');
    insertSetting.run('international_shipping', '500');
    insertSetting.run('merchant_upi_id', process.env.MERCHANT_UPI_ID || 'merchant@upi');

    // Seed admin user if not exist
    const adminExists = database.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    if (!adminExists) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('admin123', 10);
        database.prepare(
            'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)'
        ).run('Admin', 'admin@susvada.com', hash, '9999999999', 'admin');
    }

    // Seed sample products if empty
    const productCount = database.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productCount.count === 0) {
        seedProducts(database);
    }
}

function seedProducts(database) {
    const products = [
        {
            name: 'Mysore Pak Premium',
            slug: 'mysore-pak-premium',
            description: 'Authentic Mysore Pak made with pure ghee and premium gram flour. A melt-in-your-mouth delicacy crafted using traditional recipes passed down through generations. Each piece is carefully prepared to ensure the perfect texture and rich, buttery flavor.',
            short_description: 'Pure ghee Mysore Pak — traditional recipe, premium quality',
            category: 'Sweets',
            price: 450,
            compare_price: 550,
            weight: '500',
            unit: 'g',
            shelf_life_days: 15,
            stock: 50,
            hero_image: '/images/products/mysore-pak.jpg',
            tags: '["bestseller","festive","gift"]'
        },
        {
            name: 'Kaju Katli Royal',
            slug: 'kaju-katli-royal',
            description: 'Exquisite diamond-shaped cashew fudge made with the finest A-grade cashews and pure silver vark. Our Kaju Katli is known for its silky smooth texture and rich cashew aroma. Perfect for gifting and celebrations.',
            short_description: 'A-grade cashew fudge with pure silver vark',
            category: 'Sweets',
            price: 680,
            compare_price: 800,
            weight: '500',
            unit: 'g',
            shelf_life_days: 20,
            stock: 40,
            hero_image: '/images/products/kaju-katli.jpg',
            tags: '["premium","gift","festive"]'
        },
        {
            name: 'Badam Halwa Special',
            slug: 'badam-halwa-special',
            description: 'Rich and aromatic almond halwa slow-cooked in pure ghee with saffron strands. This luxurious delicacy combines the goodness of premium almonds with the exotic flavor of Kashmiri saffron.',
            short_description: 'Saffron-infused almond halwa, slow-cooked in pure ghee',
            category: 'Sweets',
            price: 520,
            compare_price: 620,
            weight: '500',
            unit: 'g',
            shelf_life_days: 12,
            stock: 30,
            hero_image: '/images/products/badam-halwa.jpg',
            tags: '["premium","saffron"]'
        },
        {
            name: 'Murukku Classic',
            slug: 'murukku-classic',
            description: 'Crispy, spiral-shaped savory snack made with rice flour and urad dal. Hand-pressed using traditional wooden molds and deep-fried to golden perfection. A South Indian classic that pairs perfectly with tea or coffee.',
            short_description: 'Hand-pressed crispy rice flour spirals — South Indian classic',
            category: 'Snacks',
            price: 280,
            compare_price: 350,
            weight: '400',
            unit: 'g',
            shelf_life_days: 30,
            stock: 80,
            hero_image: '/images/products/murukku.jpg',
            tags: '["crispy","traditional","tea-time"]'
        },
        {
            name: 'Ribbon Pakoda',
            slug: 'ribbon-pakoda',
            description: 'Thin, ribbon-like crispy snack made from gram flour with a hint of cumin and black pepper. Light, crunchy, and incredibly addictive. Perfect for evening snacking or as an accompaniment to meals.',
            short_description: 'Thin crispy gram flour ribbons with cumin & pepper',
            category: 'Snacks',
            price: 220,
            compare_price: 280,
            weight: '400',
            unit: 'g',
            shelf_life_days: 30,
            stock: 100,
            hero_image: '/images/products/ribbon-pakoda.jpg',
            tags: '["crispy","spicy","tea-time"]'
        },
        {
            name: 'Mixture Special',
            slug: 'mixture-special',
            description: 'A delightful medley of crispy noodles, peanuts, dal, and seasonings. Our special mixture is carefully blended with the perfect ratio of spices to create an irresistible savory snack mix.',
            short_description: 'Crispy savory snack mix with peanuts, noodles & spices',
            category: 'Snacks',
            price: 240,
            compare_price: 300,
            weight: '400',
            unit: 'g',
            shelf_life_days: 30,
            stock: 90,
            hero_image: '/images/products/mixture.jpg',
            tags: '["spicy","traditional"]'
        },
        {
            name: 'Cold-Pressed Groundnut Oil',
            slug: 'cold-pressed-groundnut-oil',
            description: 'Pure, unrefined groundnut oil extracted using the traditional cold-press (chekku/ghani) method. Retains all natural nutrients, antioxidants, and the authentic nutty aroma. Ideal for cooking, frying, and seasoning.',
            short_description: 'Traditional chekku groundnut oil — 100% pure & unrefined',
            category: 'Cold-Pressed Oils',
            price: 380,
            compare_price: 450,
            weight: '1',
            unit: 'L',
            shelf_life_days: 180,
            stock: 60,
            hero_image: '/images/products/groundnut-oil.jpg',
            tags: '["healthy","organic","cooking"]'
        },
        {
            name: 'Cold-Pressed Coconut Oil',
            slug: 'cold-pressed-coconut-oil',
            description: 'Virgin coconut oil extracted from fresh coconut meat using cold-press technology. Rich in lauric acid and MCTs, this oil is perfect for cooking, skin care, and hair care. Retains the natural coconut fragrance.',
            short_description: 'Virgin coconut oil — rich in MCTs & lauric acid',
            category: 'Cold-Pressed Oils',
            price: 420,
            compare_price: 500,
            weight: '1',
            unit: 'L',
            shelf_life_days: 365,
            stock: 45,
            hero_image: '/images/products/coconut-oil.jpg',
            tags: '["healthy","organic","versatile"]'
        },
        {
            name: 'Cold-Pressed Sesame Oil',
            slug: 'cold-pressed-sesame-oil',
            description: 'Premium sesame oil (gingelly oil) cold-pressed from select sesame seeds. Known for its distinctive nutty flavor and high smoke point. A staple in South Indian cuisine for tempering and traditional recipes.',
            short_description: 'Premium gingelly oil — nutty flavor, high smoke point',
            category: 'Cold-Pressed Oils',
            price: 350,
            compare_price: 420,
            weight: '1',
            unit: 'L',
            shelf_life_days: 180,
            stock: 55,
            hero_image: '/images/products/sesame-oil.jpg',
            tags: '["healthy","traditional","cooking"]'
        }
    ];

    const insert = database.prepare(`
    INSERT INTO products (name, slug, description, short_description, category, price, compare_price, weight, unit, shelf_life_days, stock, hero_image, tags)
    VALUES (@name, @slug, @description, @short_description, @category, @price, @compare_price, @weight, @unit, @shelf_life_days, @stock, @hero_image, @tags)
  `);

    const insertMany = database.transaction((items) => {
        for (const item of items) {
            insert.run(item);
        }
    });

    insertMany(products);
}

module.exports = { getDb };
