const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecommerce',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 