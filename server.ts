import express from 'express';
import { createServer as createViteServer } from 'vite';
import { INITIAL_MENU } from './src/constants/initialData.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store
let menuData = JSON.parse(JSON.stringify(INITIAL_MENU));
let orders: any[] = [];
let nextId = 100; // Starting ID for new items

// Helper to find and update items
const findCategory = (id: number) => menuData.find((c: any) => c.id === id);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'In-Memory (No DB)',
    categoriesCount: menuData.length
  });
});

// API Routes
app.get('/api/menu', (req, res) => {
  res.json(menuData);
});

app.post('/api/categories', (req, res) => {
  const { name, order } = req.body;
  const newCategory = {
    id: nextId++,
    name,
    order: order || 0,
    items: []
  };
  menuData.push(newCategory);
  menuData.sort((a: any, b: any) => a.order - b.order);
  res.json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, order } = req.body;
  const category = findCategory(id);
  if (category) {
    category.name = name;
    category.order = order;
    menuData.sort((a: any, b: any) => a.order - b.order);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const id = parseInt(req.params.id);
  menuData = menuData.filter((c: any) => c.id !== id);
  res.json({ success: true });
});

app.post('/api/items', (req, res) => {
  const { category_id, name, description, image_url, icon, prices, order } = req.body;
  const category = findCategory(parseInt(category_id));
  if (category) {
    const newItem = {
      id: nextId++,
      category_id: parseInt(category_id),
      name,
      description,
      image_url,
      icon,
      prices,
      order: order || 0
    };
    category.items.push(newItem);
    category.items.sort((a: any, b: any) => a.order - b.order);
    res.json(newItem);
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

app.put('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { category_id, name, description, image_url, icon, prices, order } = req.body;
  
  let itemFound = false;
  menuData.forEach((cat: any) => {
    const itemIndex = cat.items.findIndex((i: any) => i.id === id);
    if (itemIndex !== -1) {
      const item = cat.items[itemIndex];
      item.name = name;
      item.description = description;
      item.image_url = image_url;
      item.icon = icon;
      item.prices = prices;
      item.order = order;
      
      // If category changed
      if (cat.id !== parseInt(category_id)) {
        cat.items.splice(itemIndex, 1);
        const newCat = findCategory(parseInt(category_id));
        if (newCat) {
          item.category_id = parseInt(category_id);
          newCat.items.push(item);
          newCat.items.sort((a: any, b: any) => a.order - b.order);
        }
      } else {
        cat.items.sort((a: any, b: any) => a.order - b.order);
      }
      itemFound = true;
    }
  });

  if (itemFound) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  menuData.forEach((cat: any) => {
    cat.items = cat.items.filter((i: any) => i.id !== id);
  });
  res.json({ success: true });
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    res.json({ token: 'demo-token' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/orders', (req, res) => {
  res.json(orders.filter(o => o.status === 'pending'));
});

app.post('/api/orders', (req, res) => {
  const { table_number, items, total, type } = req.body;
  const newOrder = {
    id: nextId++,
    table_number,
    items,
    total,
    type: type || 'order',
    status: 'pending',
    created_at: new Date().toISOString()
  };
  orders.push(newOrder);
  res.json({ id: newOrder.id, success: true });
});

app.put('/api/orders/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = 'completed';
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Order not found' });
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
    app.use(express.static('dist'));
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
