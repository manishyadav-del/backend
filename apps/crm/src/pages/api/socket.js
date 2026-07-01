import { Server } from 'socket.io';

export default function handler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  // Handle hot-reloading: close old instance to prevent resource leaks
  if (global.io) {
    try { global.io.close(); } catch (e) {}
  }

  const io = new Server(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  res.socket.server.io = io;
  global.io = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Real-time client connected: ${socket.id}`);

    // Join website room for targeted real-time sync events
    socket.on('join-website', (websiteId) => {
      socket.join(websiteId);
      console.log(`[Socket] ${socket.id} joined room: ${websiteId}`);
      socket.emit('joined', { room: websiteId });

      // Acknowledge join with a sync:event
      broadcastSyncEvent(io, websiteId, {
        type: 'connect',
        websiteId,
        message: 'Dashboard connected to sync gateway',
        timestamp: new Date().toISOString()
      });
    });

    // Dashboard can emit route:update to push changes to a specific website room
    socket.on('route:update', ({ websiteId, ...data }) => {
      if (websiteId) {
        socket.to(websiteId).emit('route:update', data);
        broadcastSyncEvent(io, websiteId, { type: 'route:update', ...data, timestamp: new Date().toISOString() });
      }
    });

    // Dashboard can emit content:update
    socket.on('content:update', ({ websiteId, ...data }) => {
      if (websiteId) {
        socket.to(websiteId).emit('content:update', data);
        broadcastSyncEvent(io, websiteId, { type: 'content:update', ...data, timestamp: new Date().toISOString() });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Real-time client disconnected: ${socket.id}`);
    });
  });

  res.end();
}

/**
 * Broadcast a sync event to all sockets in a website room and to the global monitor.
 */
function broadcastSyncEvent(io, websiteId, event) {
  // Send to the website-specific room
  io.to(websiteId).emit('website:sync', event);
  // Broadcast to all dashboard monitors (room: 'monitor')
  io.to('monitor').emit('sync:event', event);
}
