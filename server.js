const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app';

// Middleware
app.use(cors());
app.use(express.json());

// ---------------- MongoDB Connection ----------------

const connectWithRetry = () => {
  console.log('[MongoDB] Connecting...');

  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => {
      console.log('[MongoDB] Connected');
    })
    .catch(err => {
      console.error('[MongoDB] Connection error:', err.message);
      console.log('[MongoDB] Retrying in 5s...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] Disconnected');
});

// ---------------- Schema ----------------

const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

// ---------------- HEALTH ENDPOINTS ----------------

// 🔹 Liveness Probe → is app running?
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// 🔹 Readiness Probe → is app ready (DB connected)?
app.get('/health/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;

  if (!dbReady) {
    return res.status(503).json({
      status: 'not ready',
      database: 'disconnected'
    });
  }

  res.status(200).json({
    status: 'ready',
    database: 'connected'
  });
});

// 🔹 General health (for UI/debug)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// ---------------- API ROUTES ----------------

app.get('/api/items', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);

  } catch (error) {
    console.error('[GET /items]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const newItem = new Item({ name, description });
    await newItem.save();

    res.status(201).json(newItem);

  } catch (error) {
    console.error('[POST /items]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const result = await Item.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('[DELETE /items]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/image', (req, res) => {
  res.json({
    imageUrl: '/img/img.jpg',
    description: 'Sample image'
  });
});

// ---------------- ERROR HANDLING ----------------

app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ---------------- GRACEFUL SHUTDOWN ----------------

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

// ---------------- START SERVER ----------------

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});