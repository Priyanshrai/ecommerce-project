const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-app-url.vercel.app', 'https://your-custom-domain.com'] 
    : 'http://localhost:3000'
}));
app.use(express.json());

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to database successfully!');
    release();
  }
});

// Routes

// Get all orders
app.get('/api/order', async (req, res) => {
  try {
    console.log('Attempting to fetch orders...');
    const ordersQuery = `
      SELECT o.id, o.orderdescription, o.createdat,
             COUNT(DISTINCT opm.productid) as countofproducts
      FROM orders o
      LEFT JOIN "OrderProductMap" opm ON o.id = opm.orderid
      GROUP BY o.id, o.orderdescription, o.createdat
      ORDER BY o.id DESC
    `;
    console.log('Executing query:', ordersQuery);
    const { rows } = await pool.query(ordersQuery);
    console.log('Query result:', rows);
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

// Get order by id
app.get('/api/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderQuery = `
      SELECT o.*, array_agg(json_build_object(
        'id', p.id,
        'productname', p.productname,
        'productdescription', p.productdescription
      )) as products
      FROM orders o
      LEFT JOIN "OrderProductMap" opm ON o.id = opm.orderid
      LEFT JOIN products p ON opm.productid = p.id
      WHERE o.id = $1
      GROUP BY o.id, o.orderdescription, o.createdat
    `;
    const { rows } = await pool.query(orderQuery, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { orderDescription, productIds } = req.body;
    
    // Insert order
    const orderResult = await client.query(
      'INSERT INTO orders (orderdescription, createdat) VALUES ($1, NOW()) RETURNING *',
      [orderDescription]
    );
    const newOrder = orderResult.rows[0];

    // Insert order-product mappings
    if (productIds && productIds.length > 0) {
      const mappingValues = productIds.map(productId => 
        `(${newOrder.id}, ${productId})`
      ).join(',');
      await client.query(`
        INSERT INTO "OrderProductMap" (orderid, productid)
        VALUES ${mappingValues}
      `);
    }

    await client.query('COMMIT');
    res.status(201).json(newOrder);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  } finally {
    client.release();
  }
});

// Update order
app.put('/api/orders/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { orderDescription, productIds } = req.body;

    // Update order
    const updateResult = await client.query(
      'UPDATE orders SET orderdescription = $1 WHERE id = $2 RETURNING *',
      [orderDescription, id]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update product mappings
    await client.query('DELETE FROM "OrderProductMap" WHERE orderid = $1', [id]);
    
    if (productIds && productIds.length > 0) {
      const mappingValues = productIds.map(productId => 
        `(${id}, ${productId})`
      ).join(',');
      await client.query(`
        INSERT INTO "OrderProductMap" (orderid, productid)
        VALUES ${mappingValues}
      `);
    }

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  } finally {
    client.release();
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Delete order-product mappings first
    await client.query('DELETE FROM "OrderProductMap" WHERE orderid = $1', [id]);
    
    // Delete order
    const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  } finally {
    client.release();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// For Vercel
module.exports = app; 