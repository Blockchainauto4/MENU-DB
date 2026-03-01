import express from 'express';
import { createServer as createViteServer } from 'vite';
const INITIAL_MENU = [
  {
    id: 1,
    name: "Drinks",
    icon: "GlassWater",
    order: 0,
    items: [
      {
        id: 1,
        category_id: 1,
        name: "Caipirinha",
        description: "Limão, açúcar, gelo e cachaça",
        image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop",
        icon: "GlassWater",
        prices: [{ label: "Dose", price: 15.00 }, { label: "Copo", price: 22.00 }],
        order: 0
      },
      {
        id: 2,
        category_id: 1,
        name: "Gin Tônica",
        description: "Gin, tônica, limão e alecrim",
        image_url: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=800&auto=format&fit=crop",
        icon: "GlassWater",
        prices: [{ label: "Copo", price: 28.00 }],
        order: 1
      }
    ]
  },
  {
    id: 2,
    name: "Cervejas",
    icon: "Beer",
    order: 1,
    items: [
      {
        id: 3,
        category_id: 2,
        name: "Heineken",
        description: "Long Neck 330ml",
        image_url: "https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=800&auto=format&fit=crop",
        icon: "Beer",
        prices: [{ label: "Unidade", price: 12.00 }],
        order: 0
      },
      {
        id: 4,
        category_id: 2,
        name: "Brahma",
        description: "Lata 350ml",
        image_url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=800&auto=format&fit=crop",
        icon: "Beer",
        prices: [{ label: "Unidade", price: 6.00 }],
        order: 1
      }
    ]
  },
  {
    id: 3,
    name: "Petiscos",
    icon: "Utensils",
    order: 2,
    items: [
      {
        id: 5,
        category_id: 3,
        name: "Batata Frita",
        description: "Porção generosa com queijo e bacon",
        image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop",
        icon: "Utensils",
        prices: [{ label: "Meia", price: 25.00 }, { label: "Inteira", price: 45.00 }],
        order: 0
      }
    ]
  }
];

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

app.post('/api/admin/reset-menu', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    menuData = JSON.parse(JSON.stringify(INITIAL_MENU));
    res.json({ success: true, menu: menuData });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
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
