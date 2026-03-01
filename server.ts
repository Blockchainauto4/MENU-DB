import express from 'express';
import { createServer as createViteServer } from 'vite';
import db, { initDb } from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB
  await initDb();

  const isPostgres = !!process.env.DATABASE_URL;

  // Helper to run queries consistently
  const query = async (text: string, params: any[] = []) => {
    if (isPostgres) {
      const res = await db.query(text, params);
      return { rows: res.rows, lastInsertId: res.rows[0]?.id };
    } else {
      // Convert $1, $2 to ? for sqlite
      const sqliteText = text.replace(/\$(\d+)/g, '?');
      const stmt = db.prepare(sqliteText);
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        return { rows: stmt.all(...params) };
      } else {
        const info = stmt.run(...params);
        return { rows: [], lastInsertId: info.lastInsertRowid };
      }
    }
  };

  // API Routes
  app.get('/api/menu', async (req, res) => {
    try {
      const categoriesRes = await query('SELECT * FROM categories ORDER BY "order"');
      const itemsRes = await query('SELECT * FROM menu_items ORDER BY "order"');
      
      const menu = categoriesRes.rows.map((cat: any) => ({
        ...cat,
        items: itemsRes.rows.filter((item: any) => item.category_id === cat.id).map((item: any) => ({
          ...item,
          prices: JSON.parse(item.prices)
        }))
      }));
      
      res.json(menu);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch menu' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    const { name, order } = req.body;
    try {
      const info = await query('INSERT INTO categories (name, "order") VALUES ($1, $2) RETURNING id', [name, order || 0]);
      res.json({ id: info.lastInsertId, name, order });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    const { name, order } = req.body;
    try {
      await query('UPDATE categories SET name = $1, "order" = $2 WHERE id = $3', [name, order, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  app.post('/api/items', async (req, res) => {
    const { category_id, name, description, image_url, icon, prices, order } = req.body;
    try {
      const info = await query(
        'INSERT INTO menu_items (category_id, name, description, image_url, icon, prices, "order") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [category_id, name, description, image_url, icon, JSON.stringify(prices), order || 0]
      );
      res.json({ id: info.lastInsertId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  app.put('/api/items/:id', async (req, res) => {
    const { category_id, name, description, image_url, icon, prices, order } = req.body;
    try {
      await query(
        'UPDATE menu_items SET category_id = $1, name = $2, description = $3, image_url = $4, icon = $5, prices = $6, "order" = $7 WHERE id = $8',
        [category_id, name, description, image_url, icon, JSON.stringify(prices), order, req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  app.delete('/api/items/:id', async (req, res) => {
    try {
      await query('DELETE FROM menu_items WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') {
      res.json({ token: 'demo-token' });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const ordersRes = await query("SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC");
      const parsedOrders = ordersRes.rows.map((order: any) => ({
        ...order,
        items: JSON.parse(order.items)
      }));
      res.json(parsedOrders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    const { table_number, items, total, type } = req.body;
    try {
      const info = await query(
        'INSERT INTO orders (table_number, items, total, type) VALUES ($1, $2, $3, $4) RETURNING id',
        [table_number, JSON.stringify(items), total, type || 'order']
      );
      res.json({ id: info.lastInsertId, success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.put('/api/orders/:id/complete', async (req, res) => {
    try {
      await query("UPDATE orders SET status = 'completed' WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete order' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving would go here
    // But for this environment we mainly care about dev mode
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
