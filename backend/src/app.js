require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes    = require('./routes/auth');
const vendorRoutes  = require('./routes/vendors');
const orderRoutes   = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');
const adminRoutes   = require('./routes/admin');
const initSocket    = require('./socket/index');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});
app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', message: 'CampusCart API running' }));

app.use('/api/auth',     authRoutes);
app.use('/api/vendors',  vendorRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin',    adminRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`\n🚀 CampusCart backend running → http://localhost:${PORT}\n`));
