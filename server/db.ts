import { Pool } from 'pg';
import Database from 'better-sqlite3';

const isPostgres = !!process.env.DATABASE_URL;

let db: any;

export const initDb = async () => {
  if (isPostgres) {
    console.log('Connecting to PostgreSQL (Neon)...');
    const { Pool } = await import('pg');
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          "order" INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS menu_items (
          id SERIAL PRIMARY KEY,
          category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          icon TEXT,
          prices TEXT NOT NULL,
          "order" INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          table_number TEXT,
          items TEXT NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          status TEXT DEFAULT 'pending',
          type TEXT DEFAULT 'order',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const res = await db.query('SELECT count(*) FROM categories');
      if (parseInt(res.rows[0].count) === 0) {
        console.log('Database empty. Seeding initial data...');
        await seed(true);
      } else {
        console.log('Database already contains data. Skipping seed.');
      }
    } catch (err) {
      console.error('Error initializing PostgreSQL:', err);
      throw err;
    }
  } else {
    console.log('Connecting to SQLite (Local)...');
    const Database = (await import('better-sqlite3')).default;
    db = new Database('menu.db');

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        "order" INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        icon TEXT,
        prices TEXT NOT NULL,
        "order" INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        type TEXT DEFAULT 'order',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const count = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
    if (count.count === 0) {
      console.log('SQLite empty. Seeding initial data...');
      await seed(false);
    }
  }
};

export const getDb = () => db;

async function seed(postgres: boolean) {
  const categories = [
    { name: 'Drinks', order: 1 },
    { name: 'Cervejas', order: 2 },
    { name: 'Bebidas Sem Álcool', order: 3 }
  ];

  const items = [
    {
      category: 'Drinks',
      name: 'Copão de Gin',
      description: 'Gin tônica refrescante com especiarias e frutas.',
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800',
      icon: 'Martini',
      prices: JSON.stringify([{ label: "1 por", price: 13 }, { label: "2 por", price: 20 }]),
      order: 1
    },
    {
      category: 'Drinks',
      name: 'Copão de Whisky',
      description: 'Whisky premium com gelo de coco e energético.',
      image_url: 'https://images.unsplash.com/photo-1527281400828-ac737a999b9a?auto=format&fit=crop&q=80&w=800',
      icon: 'GlassWater',
      prices: JSON.stringify([{ price: 30 }]),
      order: 2
    },
    {
      category: 'Drinks',
      name: 'Xeque-mate',
      description: 'A famosa mistura de mate, rum, limão e guaraná.',
      image_url: 'https://images.unsplash.com/photo-1544145945-f904253d0c71?auto=format&fit=crop&q=80&w=800',
      icon: 'Coffee',
      prices: JSON.stringify([{ label: "1 por", price: 15 }, { label: "2 por", price: 25 }]),
      order: 3
    },
    {
      category: 'Cervejas',
      name: 'Eisenbahn',
      description: 'Cerveja Pilsen puro malte 350ml.',
      image_url: 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?auto=format&fit=crop&q=80&w=800',
      icon: 'Beer',
      prices: JSON.stringify([{ price: 5 }]),
      order: 1
    },
    {
      category: 'Bebidas Sem Álcool',
      name: 'Coca-Cola',
      description: 'Refrigerante lata 350ml.',
      image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
      icon: null,
      prices: JSON.stringify([{ price: 5 }]),
      order: 2
    }
  ];

  if (postgres) {
    for (const cat of categories) {
      const res = await db.query('INSERT INTO categories (name, "order") VALUES ($1, $2) RETURNING id', [cat.name, cat.order]);
      const catId = res.rows[0].id;
      
      const catItems = items.filter(i => i.category === cat.name);
      for (const item of catItems) {
        await db.query(
          'INSERT INTO menu_items (category_id, name, description, image_url, icon, prices, "order") VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [catId, item.name, item.description, item.image_url, item.icon, item.prices, item.order]
        );
      }
    }
  } else {
    const insertCategory = db.prepare('INSERT INTO categories (name, "order") VALUES (?, ?)');
    const insertItem = db.prepare('INSERT INTO menu_items (category_id, name, description, image_url, icon, prices, "order") VALUES (?, ?, ?, ?, ?, ?, ?)');

    categories.forEach(cat => {
      const info = insertCategory.run(cat.name, cat.order);
      const catId = info.lastInsertRowid;
      
      items.filter(i => i.category === cat.name).forEach(item => {
        insertItem.run(catId, item.name, item.description, item.image_url, item.icon, item.prices, item.order);
      });
    });
  }
}

export default db;
