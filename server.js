const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'pos-data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Asegurar que exista el directorio de datos
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) return { days: {}, menu: null };
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { days: {}, menu: null }; }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET estado completo
app.get('/api/state', (req, res) => {
  res.json(readData());
});

// POST guardar estado del día actual
app.post('/api/state', (req, res) => {
  const data = readData();
  const { date, desayuno, almuerzo, menu } = req.body;
  if (!date) return res.status(400).json({ error: 'date requerido' });
  data.days[date] = { desayuno, almuerzo, savedAt: new Date().toISOString() };
  if (menu) data.menu = menu;
  writeData(data);
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`POS Comedor corriendo en http://localhost:${PORT}`);
});
