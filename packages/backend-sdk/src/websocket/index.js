import { io } from 'socket.io-client';

/**
 * Creates and configures a Socket.io WebSocket link with the Global Backend.
 * Includes connection health monitoring, offline buffer queue, and automatic reconnects.
 * 
 * @param {string} backendUrl - The platform's base URL.
 * @param {string} websiteId - Room identifier for sync broadcasts.
 * @param {object} callbacks - Event callbacks (onConnect, onDisconnect, onSync, onError, onReconnect).
 * @param {boolean} [debugMode] - Enable verbose debugging messages.
 * @returns {object} The Socket.io client wrapper instance.
 */
export function createWebSocketConnection(backendUrl, websiteId, callbacks = {}, debugMode = false) {
  const log = (...args) => {
    if (debugMode) console.log('[SDK Socket]', ...args);
  };

  const socket = io(backendUrl, {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });

  // Offline queue for sending commands to the backend when connection is active
  const offlineQueue = [];

  socket.on('connect', () => {
    log(`Connected. Socket ID: ${socket.id}. Joining room: ${websiteId}`);
    socket.emit('join-website', websiteId);
    
    // Flush offline queue
    while (offlineQueue.length > 0) {
      const { event, payload, ack } = offlineQueue.shift();
      log(`Flushing queued event: ${event}`);
      if (ack) {
        socket.emit(event, payload, ack);
      } else {
        socket.emit(event, payload);
      }
    }

    if (callbacks.onConnect) callbacks.onConnect(socket);
  });

  socket.on('joined', (data) => {
    log(`Successfully registered to room: ${data.room}`);
    if (callbacks.onJoined) callbacks.onJoined(data);
  });

  socket.on('disconnect', (reason) => {
    log(`Disconnected. Reason: ${reason}`);
    if (callbacks.onDisconnect) callbacks.onDisconnect(reason);
  });

  socket.on('connect_error', (error) => {
    log(`Connection error: ${error.message}`);
    if (callbacks.onError) callbacks.onError(error);
  });

  socket.on('reconnect', (attemptNumber) => {
    log(`Successfully reconnected after ${attemptNumber} attempts.`);
    if (callbacks.onReconnect) callbacks.onReconnect(attemptNumber);
  });

  // Inbound broadcasts
  socket.on('sync', (data) => {
    log('Received direct sync event:', data);
    if (callbacks.onSync) callbacks.onSync(data);
  });

  // Forward custom CMS real-time push messages
  const eventsToForward = [
    'page:update',
    'route:created',
    'route:updated',
    'route:deleted',
    'media:update',
    'header:update',
    'footer:update',
    'seo:update',
    'module:sync'
  ];

  for (const event of eventsToForward) {
    socket.on(event, (data) => {
      log(`Received event "${event}":`, data);
      if (callbacks.onEvent) callbacks.onEvent(event, data);
    });
  }

  // Wrapper object to allow queued emits
  return {
    socket,
    emit: (event, payload, ack) => {
      if (socket.connected) {
        if (ack) {
          socket.emit(event, payload, ack);
        } else {
          socket.emit(event, payload);
        }
      } else {
        log(`Socket offline. Queueing event: ${event}`);
        offlineQueue.push({ event, payload, ack });
      }
    },
    disconnect: () => {
      socket.disconnect();
    },
    connect: () => {
      socket.connect();
    },
    isConnected: () => socket.connected
  };
}
