// Import early polyfill initialization BEFORE PGLite to prevent race conditions
import { polyfillStatus, verifyPolyfills } from '@/lib/polyfill-init';

console.log('📦 [DATABASE] Polyfill status:', polyfillStatus);
console.log('📦 [DATABASE] Verifying polyfills before PGLite import...');

// Verify polyfills are working
const polyfillsReady = verifyPolyfills();
if (!polyfillsReady) {
  console.error('📦 [DATABASE] ❌ CRITICAL: Polyfills not ready before PGLite import!');
  throw new Error('WASM polyfills not available - cannot safely import PGLite');
} else {
  console.log('📦 [DATABASE] ✅ Polyfills verified - safe to import PGLite');
}

// Import PGLite AFTER polyfills are verified
import { PGlite } from '@electric-sql/pglite';
console.log('📦 [DATABASE] PGLite imported successfully with polyfills in place');

export interface DatabaseConfig {
  dataDir?: string;
  debug?: boolean;
}

export interface QueryResult {
  rows: any[];
  fields: any[];
  affectedRows?: number;
}

export class DatabaseManager {
  private db: PGlite | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private static instance: DatabaseManager | null = null;
  private maxRetries = 3;

  constructor(private config: DatabaseConfig = {}) {}

  // Singleton pattern to prevent multiple instances
  static getInstance(config: DatabaseConfig = {}): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create PGLite instance with configuration
      this.db = new PGlite(this.config.dataDir || 'idb://tuono-tauri-database');

      // Initialize schema
      await this.setupSchema();
      
      this.isInitialized = true;
      
      if (this.config.debug) {
        console.log('Database initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async initializeSimple(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      console.log('📦 [DATABASE] Already initialized, skipping...');
      return;
    }

    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      console.log('📦 [DATABASE] Initialization in progress, waiting...');
      return this.initializationPromise;
    }

    // Start initialization and store the promise
    console.log('📦 [DATABASE] Starting new initialization...');
    this.initializationPromise = this._performInitializationWithRetry();
    
    try {
      await this.initializationPromise;
      console.log('📦 [DATABASE] Initialization completed successfully');
    } catch (error) {
      console.error('📦 [DATABASE] Initialization failed after all retries:', error);
      throw error;
    } finally {
      // Clear the promise once initialization is complete (success or failure)
      this.initializationPromise = null;
    }
  }

  private async _performInitializationWithRetry(): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📦 [DATABASE] Initialization attempt ${attempt}/${this.maxRetries}`);
        await this._performInitialization();
        // Reset retry count on success
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`📦 [DATABASE] Attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`📦 [DATABASE] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Set retry count to max retries
    throw lastError || new Error('Database initialization failed after all retries');
  }

  private async _performInitialization(): Promise<void> {
    try {
      // Only initialize in browser environment
      if (typeof window === 'undefined') {
        throw new Error('Database initialization requires browser environment');
      }

      console.log('🚀 [DATABASE] Creating PGlite instance...');
      
      // Create PGlite instance with configuration
      const dataDir = this.config.dataDir || 'idb://tuono-tauri-database';
      console.log('🚀 [DATABASE] Using data directory:', dataDir);
      
      this.db = new PGlite(dataDir);

      console.log('⏳ [DATABASE] Waiting for WASM initialization...');
      // Wait for WASM to initialize properly
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🔍 [DATABASE] Testing database connection...');
      // Test the connection with a simple query
      await this.db.query('SELECT 1 as test');
      console.log('✅ [DATABASE] Connection test successful');

      console.log('🏗️ [DATABASE] Setting up database schema...');
      // Initialize simplified schema without problematic extensions
      await this.setupSimpleSchema();
      
      this.isInitialized = true;
      
      if (this.config.debug) {
        console.log('✅ [DATABASE] Database initialized successfully (simple mode)');
      }
    } catch (error) {
      console.error('❌ [DATABASE] Failed to initialize database:', error);
      this.isInitialized = false;
      
      // Clean up failed instance
      if (this.db) {
        try {
          await this.db.close();
        } catch (closeError) {
          console.warn('⚠️ [DATABASE] Failed to close database during cleanup:', closeError);
        }
        this.db = null;
      }
      
      // Re-throw the error so the UI can handle it properly
      throw error;
    }
  }

  private async setupSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.exec(`
      -- Enable extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT uuid_generate_v4(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        total DECIMAL(10,2) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create order_items table
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

      -- Create triggers for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_products_updated_at ON products;
      CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
      CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Insert sample data if tables are empty
    await this.insertSampleData();
  }

  private async setupSimpleSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.exec(`
      -- Create users table (simplified)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create products table (simplified)
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create orders table (simplified)
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create order_items table (simplified)
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create basic indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    `);

    // Insert simplified sample data
    await this.insertSimpleSampleData();
  }

  private async insertSampleData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const userCount = await this.db.query('SELECT COUNT(*) as count FROM users');
    if ((userCount.rows[0] as any).count > 0) return;

    await this.db.exec(`
      -- Insert sample users
      INSERT INTO users (name, email, role, metadata) VALUES
        ('Alice Johnson', 'alice@example.com', 'admin', '{"preferences": {"theme": "dark", "notifications": true}}'),
        ('Bob Smith', 'bob@example.com', 'user', '{"preferences": {"theme": "light", "notifications": false}}'),
        ('Carol Davis', 'carol@example.com', 'moderator', '{"preferences": {"theme": "auto", "notifications": true}}'),
        ('David Wilson', 'david@example.com', 'user', '{"preferences": {"theme": "dark", "notifications": true}}'),
        ('Eva Brown', 'eva@example.com', 'user', '{"preferences": {"theme": "light", "notifications": false}}');

      -- Insert sample products
      INSERT INTO products (name, description, price, category, tags, metadata) VALUES
        ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', '{"laptop", "computer", "professional"}', '{"specs": {"cpu": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}}'),
        ('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'Accessories', '{"mouse", "wireless", "ergonomic"}', '{"specs": {"dpi": "1600", "battery": "AA", "range": "10m"}}'),
        ('USB-C Hub', 'Multi-port USB-C hub with HDMI and ethernet', 79.99, 'Accessories', '{"hub", "usb-c", "hdmi"}', '{"specs": {"ports": "7", "power": "100W", "hdmi": "4K"}}'),
        ('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 149.99, 'Accessories', '{"keyboard", "mechanical", "rgb"}', '{"specs": {"switches": "blue", "backlight": "RGB", "layout": "full"}}'),
        ('4K Monitor', '27-inch 4K IPS monitor with USB-C', 399.99, 'Electronics', '{"monitor", "4k", "ips"}', '{"specs": {"size": "27inch", "resolution": "4K", "panel": "IPS"}}');

      -- Insert sample orders
      INSERT INTO orders (user_id, status, total, metadata) VALUES
        (1, 'completed', 1299.99, '{"payment_method": "credit_card", "shipping_address": "123 Main St"}'),
        (2, 'pending', 59.98, '{"payment_method": "paypal", "shipping_address": "456 Oak Ave"}'),
        (1, 'shipped', 79.99, '{"payment_method": "credit_card", "shipping_address": "123 Main St"}'),
        (3, 'completed', 549.98, '{"payment_method": "debit_card", "shipping_address": "789 Pine Rd"}'),
        (4, 'pending', 149.99, '{"payment_method": "credit_card", "shipping_address": "321 Elm St"}');

      -- Insert sample order items
      INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
        (1, 1, 1, 1299.99),
        (2, 2, 2, 29.99),
        (3, 3, 1, 79.99),
        (4, 2, 1, 29.99),
        (4, 4, 1, 149.99),
        (4, 5, 1, 399.99),
        (5, 4, 1, 149.99);
    `);
  }

  private async insertSimpleSampleData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const userCount = await this.db.query('SELECT COUNT(*) as count FROM users');
    if ((userCount.rows[0] as any).count > 0) return;

    await this.db.exec(`
      -- Insert sample users (simplified)
      INSERT INTO users (name, email, role) VALUES
        ('Alice Johnson', 'alice@example.com', 'admin'),
        ('Bob Smith', 'bob@example.com', 'user'),
        ('Carol Davis', 'carol@example.com', 'moderator'),
        ('David Wilson', 'david@example.com', 'user'),
        ('Eva Brown', 'eva@example.com', 'user');

      -- Insert sample products (simplified)
      INSERT INTO products (name, description, price, category) VALUES
        ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics'),
        ('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'Accessories'),
        ('USB-C Hub', 'Multi-port USB-C hub with HDMI and ethernet', 79.99, 'Accessories'),
        ('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 149.99, 'Accessories'),
        ('4K Monitor', '27-inch 4K IPS monitor with USB-C', 399.99, 'Electronics');

      -- Insert sample orders (simplified)
      INSERT INTO orders (user_id, status, total) VALUES
        (1, 'completed', 1299.99),
        (2, 'pending', 59.98),
        (1, 'shipped', 79.99),
        (3, 'completed', 549.98),
        (4, 'pending', 149.99);

      -- Insert sample order items
      INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
        (1, 1, 1, 1299.99),
        (2, 2, 2, 29.99),
        (3, 3, 1, 79.99),
        (4, 2, 1, 29.99),
        (4, 4, 1, 149.99),
        (5, 4, 1, 149.99);
    `);
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initializeSimple() first.');
    }

    if (!this.isInitialized) {
      throw new Error('Database initialization failed. Check console for errors.');
    }

    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async exec(sql: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.exec(sql);
    } catch (error) {
      console.error('Exec error:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (db: PGlite) => Promise<T>): Promise<T> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.exec('BEGIN');
      const result = await callback(this.db!);
      await this.db!.exec('COMMIT');
      return result;
    } catch (error) {
      await this.db!.exec('ROLLBACK');
      throw error;
    }
  }

  async getStats(): Promise<any> {
    const stats = await this.query(`
      SELECT 
        'users' as table_name,
        COUNT(*) as count
      FROM users
      UNION ALL
      SELECT 
        'products' as table_name,
        COUNT(*) as count
      FROM products
      UNION ALL
      SELECT 
        'orders' as table_name,
        COUNT(*) as count
      FROM orders
      UNION ALL
      SELECT 
        'order_items' as table_name,
        COUNT(*) as count
      FROM order_items
    `);

    return stats.rows.reduce((acc, row) => {
      acc[row.table_name] = parseInt(row.count);
      return acc;
    }, {});
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  get isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  get instance(): PGlite | null {
    return this.db;
  }

  async reset(): Promise<void> {
    console.log('🔄 [DATABASE] Resetting database connection...');
    
    // Close existing connection
    if (this.db) {
      try {
        await this.db.close();
      } catch (error) {
        console.warn('⚠️ [DATABASE] Error closing database during reset:', error);
      }
    }
    
    // Reset state
    this.db = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    // Reset retry count
    
    console.log('✅ [DATABASE] Database reset complete');
  }

  async retryConnection(): Promise<void> {
    console.log('🔄 [DATABASE] Retrying database connection...');
    await this.reset();
    await this.initializeSimple();
  }
}

// Singleton instance for the application
export const database = DatabaseManager.getInstance({
  dataDir: 'idb://tuono-tauri-app',
  debug: process.env.NODE_ENV === 'development'
});

// Predefined queries for common operations
export const queries = {
  users: {
    getAll: 'SELECT * FROM users ORDER BY created_at DESC',
    getById: 'SELECT * FROM users WHERE id = $1',
    getByEmail: 'SELECT * FROM users WHERE email = $1',
    create: 'INSERT INTO users (name, email, role, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
    update: 'UPDATE users SET name = $1, email = $2, role = $3, metadata = $4 WHERE id = $5 RETURNING *',
    delete: 'DELETE FROM users WHERE id = $1'
  },
  products: {
    getAll: 'SELECT * FROM products ORDER BY created_at DESC',
    getById: 'SELECT * FROM products WHERE id = $1',
    getByCategory: 'SELECT * FROM products WHERE category = $1 ORDER BY price ASC',
    create: 'INSERT INTO products (name, description, price, category, tags, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    update: 'UPDATE products SET name = $1, description = $2, price = $3, category = $4, tags = $5, metadata = $6 WHERE id = $7 RETURNING *',
    delete: 'DELETE FROM products WHERE id = $1'
  },
  orders: {
    getAll: `
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
    `,
    getById: `
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `,
    getByUser: `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
    create: 'INSERT INTO orders (user_id, status, total, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
    update: 'UPDATE orders SET status = $1, total = $2, metadata = $3 WHERE id = $4 RETURNING *',
    delete: 'DELETE FROM orders WHERE id = $1'
  },
  analytics: {
    salesByCategory: `
      SELECT 
        p.category,
        COUNT(oi.id) as units_sold,
        SUM(oi.price * oi.quantity) as revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.category
      ORDER BY revenue DESC
    `,
    topUsers: `
      SELECT 
        u.name,
        u.email,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.name, u.email
      ORDER BY total_spent DESC
      LIMIT 10
    `,
    recentActivity: `
      SELECT 
        'order' as type,
        o.id,
        u.name as user_name,
        o.total as amount,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 20
    `
  }
};