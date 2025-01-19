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
    const ordersQuery = `
      SELECT o.id, o.orderDescription, o."createdAt",
             COUNT(DISTINCT opm.productId) as "countOfProducts"
      FROM orders o
      LEFT JOIN "OrderProductMap" opm ON o.id = opm."orderId"
      GROUP BY o.id, o.orderDescription, o."createdAt"
      ORDER BY o.id DESC
    `;
    const { rows } = await pool.query(ordersQuery);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get order by id
app.get('/api/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderQuery = `
      SELECT o.*, array_agg(json_build_object(
        'id', p.id,
        'productName', p."productName",
        'productDescription', p."productDescription"
      )) as products
      FROM orders o
      LEFT JOIN "OrderProductMap" opm ON o.id = opm."orderId"
      LEFT JOIN products p ON opm."productId" = p.id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const { rows } = await pool.query(orderQuery, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      'INSERT INTO orders (orderDescription, "createdAt") VALUES ($1, NOW()) RETURNING *',
      [orderDescription]
    );
    const newOrder = orderResult.rows[0];

    // Insert order-product mappings
    if (productIds && productIds.length > 0) {
      const mappingValues = productIds.map(productId => 
        `(${newOrder.id}, ${productId})`
      ).join(',');
      await client.query(`
        INSERT INTO "OrderProductMap" ("orderId", "productId")
        VALUES ${mappingValues}
      `);
    }

    await client.query('COMMIT');
    res.status(201).json(newOrder);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
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
      'UPDATE orders SET orderDescription = $1 WHERE id = $2 RETURNING *',
      [orderDescription, id]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update product mappings
    await client.query('DELETE FROM "OrderProductMap" WHERE "orderId" = $1', [id]);
    
    if (productIds && productIds.length > 0) {
      const mappingValues = productIds.map(productId => 
        `(${id}, ${productId})`
      ).join(',');
      await client.query(`
        INSERT INTO "OrderProductMap" ("orderId", "productId")
        VALUES ${mappingValues}
      `);
    }

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
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
    await client.query('DELETE FROM "OrderProductMap" WHERE "orderId" = $1', [id]);
    
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
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 