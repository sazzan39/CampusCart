const jwt = require('jsonwebtoken');

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join:order', (orderId) => socket.join(`order:${orderId}`));
    socket.on('leave:order', (orderId) => socket.leave(`order:${orderId}`));
    socket.on('join:vendor', (vendorId) => socket.join(`vendor:${vendorId}`));
    socket.on('delivery:online', () => socket.join('delivery_partners'));
    socket.on('delivery:offline', () => socket.leave('delivery_partners'));
    socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
  });
};

module.exports = initSocket;
