const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool(
  process.env.NODE_ENV === 'production'
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
      }
);

const setupDatabase = async () => {
  try {
    // Drop existing tables
    await pool.query('DROP TABLE IF EXISTS "OrderProductMap" CASCADE');
    await pool.query('DROP TABLE IF EXISTS orders CASCADE');
    await pool.query('DROP TABLE IF EXISTS products CASCADE');

    console.log('Dropped existing tables');

    // Create orders table
    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        orderdescription VARCHAR(100) NOT NULL,
        createdat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created orders table');

    // Create products table
    await pool.query(`
      CREATE TABLE products (
        id INT PRIMARY KEY,
        productname VARCHAR(100) NOT NULL,
        productdescription TEXT
      )
    `);
    console.log('Created products table');

    // Create OrderProductMap table
    await pool.query(`
      CREATE TABLE "OrderProductMap" (
        id SERIAL PRIMARY KEY,
        orderid INT NOT NULL,
        productid INT NOT NULL,
        FOREIGN KEY (orderid) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (productid) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('Created OrderProductMap table');

    // Insert initial product data
    await pool.query(`
      INSERT INTO products (id, productname, productdescription) VALUES
        (1, 'HP laptop', 'This is HP laptop'),
        (2, 'lenovo laptop', 'This is lenovo'),
        (3, 'Car', 'This is Car'),
        (4, 'Bike', 'This is Bike')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('Inserted initial product data');

    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await pool.end();
  }
};

setupDatabase(); 