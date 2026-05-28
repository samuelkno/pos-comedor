const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'pos.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// ── Inicializar base de datos ──
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS dias (
    fecha     TEXT PRIMARY KEY,
    desayuno  TEXT NOT NULL DEFAULT '{"open":false,"openTime":null,"closeTime":null,"sales":[]}',
    almuerzo  TEXT NOT NULL DEFAULT '{"open":false,"openTime":null,"closeTime":null,"sales":[]}',
    guardado  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS menu (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL,
    price REAL NOT NULL,
    cat   TEXT NOT NULL DEFAULT 'platos'
  );
`);

// Insertar menú por defecto si está vacío
const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu').get();
if (menuCount.c === 0) {
  const insert = db.prepare('INSERT INTO menu (name, price, cat) VALUES (?, ?, ?)');
  const defaults = [
    ['Huevos revueltos', 3.50, 'platos'],
    ['Casado de pollo',  5.00, 'platos'],
    ['Arroz con frijoles', 4.00, 'platos'],
    ['Frijoles con queso', 3.00, 'porciones'],
    ['Plátano frito',    1.50, 'porciones'],
    ['Jugo natural',     1.50, 'bebidas'],
    ['Café con leche',   1.25, 'bebidas'],
    ['Agua pura',        0.75, 'bebidas'],
  ];
  defaults.forEach(d => insert.run(...d));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── GET estado completo ──
app.get('/api/state', (req, res) => {
  const today = req.query.date || '';

  // Menú
  const menu = db.prepare('SELECT * FROM menu ORDER BY id').all();

  // Día de hoy
  let todayData = null;
  if (today) {
    const row = db.prepare('SELECT * FROM dias WHERE fecha = ?').get(today);
    if (row) {
      todayData = {
        desayuno: JSON.parse(row.desayuno),
        almuerzo: JSON.parse(row.almuerzo),
      };
    }
  }

  // Historial (todos los días excepto hoy, ordenados desc)
  const historyRows = db.prepare(
    'SELECT * FROM dias WHERE fecha != ? ORDER BY fecha DESC'
  ).all(today || '');

  const history = {};
  historyRows.forEach(r => {
    history[r.fecha] = {
      desayuno: JSON.parse(r.desayuno),
      almuerzo: JSON.parse(r.almuerzo),
    };
  });

  res.json({ menu, today: todayData, history });
});

// ── POST guardar día ──
app.post('/api/state', (req, res) => {
  const { date, desayuno, almuerzo } = req.body;
  if (!date) return res.status(400).json({ error: 'date requerido' });

  db.prepare(`
    INSERT INTO dias (fecha, desayuno, almuerzo, guardado)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(fecha) DO UPDATE SET
      desayuno = excluded.desayuno,
      almuerzo = excluded.almuerzo,
      guardado = excluded.guardado
  `).run(date, JSON.stringify(desayuno), JSON.stringify(almuerzo));

  res.json({ ok: true });
});

// ── POST guardar menú completo ──
app.post('/api/menu', (req, res) => {
  const { menu } = req.body;
  if (!Array.isArray(menu)) return res.status(400).json({ error: 'menu requerido' });

  const del = db.prepare('DELETE FROM menu');
  const ins = db.prepare('INSERT INTO menu (id, name, price, cat) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(() => {
    del.run();
    menu.forEach(m => ins.run(m.id, m.name, m.price, m.cat || 'platos'));
  });
  tx();

  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`POS Comedor corriendo en http://localhost:${PORT}`);
});
