/**
 * SyncManager — Manages real-time WebSocket sync between frontend and Global Backend.
 * Falls back to polling every 30s if WebSocket is unavailable.
 */

export type SyncEvent = 'route:update' | 'content:update' | 'settings:update' | 'page:update' | 'website:sync' | 'header:update' | 'footer:update';

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
        'page:update', 'website:sync', 'header:update', 'footer:update'
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

export class CentralSyncManager {
  private client: any;
  private cache: Map<string, { data: any; lastFetched: number; error: string | null }> = new Map();
  private activeRequests: Map<string, Promise<any>> = new Map();
  private subscribers: Map<string, Set<(state: { data: any; loading: boolean; error: string | null; isReconnecting: boolean }) => void>> = new Map();
  private pollIntervals: Map<string, number> = new Map(); // key -> intervalMs
  private nextPollTimes: Map<string, number> = new Map(); // key -> timestamp
  private pollTimer: any = null;
  private isReconnecting = false;
  private debounceTimers: Map<string, any> = new Map();

  constructor(client: any) {
    this.client = client;
    this.setupListeners();
  }

  private log(...args: any[]) {
    const isDebug = this.client.debugMode || this.client.config?.debug;
    if (isDebug) {
      console.log('[SDK DEBUG] [CentralSyncManager]', ...args);
    }
  }

  private setupListeners() {
    if (!this.client || typeof this.client.on !== 'function') return;

    this.client.on('connected', () => {
      this.log('Connected to real-time sync server');
      this.isReconnecting = false;
      this.notifyAll();
    });

    this.client.on('disconnected', () => {
      this.log('Disconnected from real-time sync server');
      this.isReconnecting = true;
      this.notifyAll();
    });

    this.client.on('reconnect', () => {
      this.log('Reconnected to real-time sync server');
      this.isReconnecting = false;
      this.notifyAll();
      this.refetchAll();
    });

    const handleComponentEvent = (eventData: any) => {
      this.log('Real-time event received:', eventData);
      const name = eventData?.name || eventData?.componentName;
      if (!name) return;

      for (const key of this.cache.keys()) {
        const [compName, routePath] = key.split('::');
        if (compName === name) {
          const eventRoute = eventData.route || eventData.routePath || '/';
          if (eventRoute === '/' || eventRoute === routePath) {
            this.log(`Scheduling refetch for component "${name}" on route "${routePath}"`);
            this.scheduleFetch(name, routePath, 100);
          }
        }
      }
    };

    const events = [
      'component.updated', 'component.created', 'component.deleted',
      'component:update', 'component:updated', 'component:created', 'component:deleted'
    ];
    for (const ev of events) {
      this.client.on(ev, handleComponentEvent);
    }

    this.client.on('sync', (update: any) => {
      if (update.type === 'component') {
        handleComponentEvent(update.data);
      } else if (update.type === 'settings' || update.type === 'brand') {
        this.log('Settings changed, refetching all components...');
        this.refetchAll();
      }
    });

    this.client.on('settings:update', () => {
      this.log('Global settings updated, refetching all components...');
      this.refetchAll();
    });
  }

  getCache(key: string) {
    return this.cache.get(key);
  }

  isFetching(key: string) {
    return this.activeRequests.has(key);
  }

  isClientReconnecting() {
    return this.isReconnecting;
  }

  forceFetch(componentName: string, routePath: string) {
    this.scheduleFetch(componentName, routePath, 0);
  }

  subscribe(
    componentName: string,
    routePath: string,
    fallbackProps: any,
    options: { refreshInterval?: number; mode?: 'preview' | 'dashboard' | 'background' } | undefined,
    callback: (state: { data: any; loading: boolean; error: string | null; isReconnecting: boolean }) => void
  ): () => void {
    const key = `${componentName}::${routePath}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    let intervalMs = options?.refreshInterval;
    if (!intervalMs && options?.mode) {
      if (options.mode === 'preview') intervalMs = 3000;
      else if (options.mode === 'dashboard') intervalMs = 7000;
      else if (options.mode === 'background') intervalMs = 45000;
    }

    if (intervalMs) {
      this.pollIntervals.set(key, intervalMs);
      if (!this.nextPollTimes.has(key)) {
        this.nextPollTimes.set(key, Date.now() + intervalMs);
      }
      this.startGlobalTimer();
    }

    const cached = this.cache.get(key);
    if (!cached) {
      this.scheduleFetch(componentName, routePath, 0, fallbackProps);
    } else {
      callback({
        data: cached.data,
        loading: this.activeRequests.has(key),
        error: cached.error,
        isReconnecting: this.isReconnecting
      });
    }

    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
          this.pollIntervals.delete(key);
          this.nextPollTimes.delete(key);
          if (this.subscribers.size === 0) {
            this.stopGlobalTimer();
          }
        }
      }
    };
  }

  private startGlobalTimer() {
    if (this.pollTimer) return;
    this.log('Starting central synchronization timer loop');
    this.pollTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, nextTime] of this.nextPollTimes.entries()) {
        if (now >= nextTime) {
          const [componentName, routePath] = key.split('::');
          this.log(`Interval trigger for: ${key}`);
          this.scheduleFetch(componentName, routePath, 0);
          
          const interval = this.pollIntervals.get(key) || 30000;
          this.nextPollTimes.set(key, now + interval);
        }
      }
    }, 1000);
  }

  private stopGlobalTimer() {
    if (this.pollTimer) {
      this.log('Stopping central synchronization timer loop (no active subscribers)');
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private scheduleFetch(componentName: string, routePath: string, delayMs: number, fallbackProps?: any) {
    const key = `${componentName}::${routePath}`;

    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    if (delayMs > 0) {
      const timer = setTimeout(() => {
        this.debounceTimers.delete(key);
        this.executeFetch(componentName, routePath, fallbackProps);
      }, delayMs);
      this.debounceTimers.set(key, timer);
    } else {
      this.executeFetch(componentName, routePath, fallbackProps);
    }
  }

  private executeFetch(componentName: string, routePath: string, fallbackProps?: any) {
    const key = `${componentName}::${routePath}`;

    if (this.activeRequests.has(key)) {
      this.log(`Reusing in-flight request for: ${key}`);
      return this.activeRequests.get(key);
    }

    this.log(`Initiating fetch for: ${key}`);
    const promise = (async () => {
      const apiKey = typeof this.client.getApiKey === 'function' ? this.client.getApiKey() : this.client.apiKey;
      const backendUrl = typeof this.client.getBackendUrl === 'function' ? this.client.getBackendUrl() : this.client.backendUrl;
      if (!apiKey || !backendUrl) {
        throw new Error('API Key or Backend URL not found on client');
      }

      const url = `${backendUrl}/api/components/data?name=${encodeURIComponent(componentName)}&route=${encodeURIComponent(routePath)}`;
      
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const json = await response.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Fetch component data succeeded but success=false or data missing');
      }
      return json.data;
    })();

    this.notify(key, { loading: true });
    this.activeRequests.set(key, promise);

    promise.then(
      (data) => {
        this.activeRequests.delete(key);
        const resolvedData = fallbackProps ? { ...fallbackProps, ...data } : data;
        this.cache.set(key, { data: resolvedData, lastFetched: Date.now(), error: null });
        this.notify(key, { data: resolvedData, loading: false, error: null });
      },
      (err) => {
        this.activeRequests.delete(key);
        this.log(`Fetch failed for ${key}:`, err.message);
        
        const prev = this.cache.get(key);
        const errorMsg = err.message || 'Failed to fetch component data';
        this.cache.set(key, {
          data: prev?.data || fallbackProps || null,
          lastFetched: Date.now(),
          error: errorMsg
        });
        this.notify(key, {
          data: prev?.data || fallbackProps || null,
          loading: false,
          error: errorMsg
        });
      }
    );

    return promise;
  }

  private notify(key: string, updates: { data?: any; loading?: boolean; error?: string | null }) {
    const subs = this.subscribers.get(key);
    if (!subs) return;

    const cached = this.cache.get(key);
    const data = updates.data !== undefined ? updates.data : cached?.data || null;
    const loading = updates.loading !== undefined ? updates.loading : this.activeRequests.has(key);
    const error = updates.error !== undefined ? updates.error : cached?.error || null;

    subs.forEach(callback => {
      try {
        callback({
          data,
          loading,
          error,
          isReconnecting: this.isReconnecting
        });
      } catch (e) {
        console.error('[CentralSyncManager] Subscriber notify error:', e);
      }
    });
  }

  private notifyAll() {
    for (const key of this.subscribers.keys()) {
      this.notify(key, {});
    }
  }

  private refetchAll() {
    this.log('Refetching all active synchronized components');
    for (const key of this.subscribers.keys()) {
      const [componentName, routePath] = key.split('::');
      this.scheduleFetch(componentName, routePath, 0);
    }
  }
}

export function getCentralSyncManager(client: any): CentralSyncManager {
  if (!client) {
    throw new Error('getCentralSyncManager: client is required');
  }
  if (!client.__centralSyncManager) {
    client.__centralSyncManager = new CentralSyncManager(client);
  }
  return client.__centralSyncManager;
}
