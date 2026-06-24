/**
 * Socket.io Event Broadcasting Helper
 */

/**
 * Broadcasts an event to all sockets in a specific website room.
 * Also broadcasts a sync:event to the global monitor room.
 * @param {string} websiteId The website ID / room name
 * @param {string} event The socket event name (e.g. 'route:update', 'content:update')
 * @param {object} data The event payload
 */
export function broadcastToWebsite(websiteId, event, data) {
  try {
    const io = global.io;
    if (io) {
      // Targeted broadcast to website room
      io.to(websiteId).emit(event, data);

      // Also send to global sync monitor room
      io.to('monitor').emit('sync:event', {
        type: event,
        websiteId,
        ...data,
        timestamp: new Date().toISOString()
      });

      console.log(`[Socket Broadcast] Room: ${websiteId}, Event: ${event}`);
      return true;
    }
    console.log(`[Socket Broadcast Skip] Server not initialized. Room: ${websiteId}, Event: ${event}`);
    return false;
  } catch (error) {
    console.error('Socket broadcast error:', error);
    return false;
  }
}
