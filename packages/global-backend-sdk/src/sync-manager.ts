/**
 * SyncManager — Manages real-time WebSocket sync between frontend and Global Backend.
 * Falls back to polling every 30s if WebSocket is unavailable.
 */

export type SyncEvent = 'route:update' | 'content:update' | 'settings:update' | 'page:update' | 'website:sync';

export type SyncCallback = (data: any) => void;

export interface SyncManagerConfig {
  backendUrl: string;
  websiteId: string;
  syncToken: string;
  pollIntervalMs?: number;
  debug?: boolean;
}

export class SyncManager {
  private config: Required<SyncManagerConfig>;
  private socket: any = null;
  private listeners: Map<string, Set<SyncCallback>> = new Map();
  private pollTimer: any = null;
  private reconnectTimer: any = null;
  private reconnectDelay = 2000;
  private connected = false;
  private destroyed = false;

  constructor(config: SyncManagerConfig) {
    this.config = {
      pollIntervalMs: 30_000,
      debug: false,
      ...config
    };
  }

  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[SyncManager]', ...args);
    }
  }

  /** Connect WebSocket (browser only). Falls back to polling on failure. */
  async connect() {
    if (typeof window === 'undefined') return; // server-side: skip

    // Initialize socket server first
    await fetch(`${this.config.backendUrl}/api/socket`).catch(() => {});

    try {
      const { io } = await import('socket.io-client');

      const socket = io(this.config.backendUrl, {
        path: '/api/socket',
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        auth: { token: this.config.syncToken }
      });

      this.socket = socket;

      socket.on('connect', () => {
        this.connected = true;
        this.reconnectDelay = 2000;
        this.stopPolling(); // WebSocket up — stop polling
        this.log('Connected via WebSocket');

        // Join website room for targeted events
        socket.emit('join-website', this.config.websiteId);
      });

      socket.on('disconnect', () => {
        this.connected = false;
        this.log('Disconnected. Starting polling fallback.');
        this.startPolling();
      });

      socket.on('connect_error', () => {
        this.connected = false;
        this.startPolling();
      });

      // Forward all sync events to listeners
      const events: SyncEvent[] = [
        'route:update', 'content:update', 'settings:update',
        'page:update', 'website:sync'
      ];
      for (const event of events) {
        socket.on(event, (data: any) => {
          this.log(`Event: ${event}`, data);
          this.emit(event, data);

          // Force page reload on Apply Changes sync broadcast
          if (event === 'website:sync' && data?.action === 'REFRESH') {
            this.log('Apply Changes triggered by administrator. Refreshing client...');
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        });
      }

      // Generic sync envelope
      socket.on('sync', (update: { type: string; data: any }) => {
        const eventName = `${update.type}:update` as SyncEvent;
        this.emit(eventName, update.data);
      });

    } catch (err) {
      this.log('WebSocket unavailable, using polling:', err);
      this.startPolling();
    }
  }

  /** Subscribe to a sync event */
  on(event: SyncEvent | string, cb: SyncCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
    return () => this.off(event, cb);
  }

  /** Unsubscribe from a sync event */
  off(event: string, cb: SyncCallback) {
    this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(data); } catch (e) { console.error('[SyncManager] Listener error:', e); }
    });
  }

  private startPolling() {
    if (this.pollTimer || this.destroyed) return;
    this.log(`Polling every ${this.config.pollIntervalMs}ms`);
    this.pollTimer = setInterval(() => this.poll(), this.config.pollIntervalMs);
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async poll() {
    try {
      const res = await fetch(
        `${this.config.backendUrl}/api/websites/${this.config.websiteId}`,
        { headers: { Authorization: `Bearer ${this.config.syncToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        this.emit('website:sync', { websiteId: this.config.websiteId, ...data.data });
      }
    } catch (err) {
      this.log('Poll failed:', err);
    }
  }

  /** Whether WebSocket is currently connected */
  isConnected() {
    return this.connected;
  }

  /** Cleanly disconnect and stop polling */
  destroy() {
    this.destroyed = true;
    this.stopPolling();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.log('Destroyed');
  }
}
