import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { detectFramework } from './detector.js';
import { scanNextJsRoutes, discoverSiteMetadata } from '../routes/index.js';
import { discoverSiteModules } from '../modules/index.js';
import { createWebSocketConnection } from '../websocket/index.js';

export class GlobalBackendSDK extends EventEmitter {
  /**
   * Create a new GlobalBackendSDK instance.
   * @param {object} config
   * @param {string} config.apiKey - The API Key of the project.
   * @param {string} config.websiteId - The ID of the website.
   * @param {string} [config.backendUrl] - The URL of the Global Backend CMS platform.
   * @param {string} [config.domain] - The domain of this external website.
   * @param {string} [config.apiUrl] - Optional custom API Webhook URL of this website.
   * @param {string} [config.framework] - Custom framework string (overrides auto-detection).
   * @param {boolean} [config.debug] - Enable debug logging.
   */
  constructor({ apiKey, websiteId, backendUrl, domain, apiUrl, framework, debug = false }) {
    super();
    if (!apiKey) throw new Error('GlobalBackendSDK: apiKey is required');
    if (!websiteId) throw new Error('GlobalBackendSDK: websiteId is required');

    this.apiKey = apiKey;
    this.websiteId = websiteId;
    this.debugMode = debug;

    // Resolve Backend URL
    const envBackendUrl = typeof process !== 'undefined' ? (process.env.GLOBAL_BACKEND_URL || process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL) : '';
    this.backendUrl = (backendUrl || envBackendUrl || 'http://localhost:3000').replace(/\/$/, '');

    // Resolve Domain
    const envDomain = typeof process !== 'undefined' ? (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000') : 'localhost:3000';
    this.domain = domain || envDomain;

    // Resolve API URL (webhook callback endpoint)
    this.apiUrl = apiUrl || `http://${this.domain}/api/global`;

    this.customFramework = framework;
    this.frameworkMeta = null;
    this.syncToken = null;
    this.socketWrapper = null;
    this.initialized = false;
    this.components = {};
    this.syncQueue = [];
    this.watcher = null;
    this.isOffline = false;

    // Monitor process environment if browser
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this._handleOnlineStatus(true));
      window.addEventListener('offline', () => this._handleOnlineStatus(false));
    }
  }

  /**
   * Enable or disable debug logging dynamically.
   * @param {boolean} flag
   */
  debug(flag) {
    this.debugMode = flag;
  }

  log(...args) {
    if (this.debugMode) {
      console.log(`[SDK DEBUG] [${new Date().toISOString()}]`, ...args);
    }
  }

  /**
   * Register a custom CMS section frontend component.
   * @param {string} type - Section type (e.g. "HeroSection", "Testimonials")
   * @param {any} component - React/Vite component
   */
  registerComponent(type, component) {
    this.components[type] = component;
    this.log(`Component registered for CMS content type: "${type}"`);
    this.emit('component:registered', { type, component });
  }

  /**
   * Initialize connection, perform handshake, sync routes, modules and establish WebSockets.
   */
  async initialize() {
    if (this.initialized) return;

    this.log(`Initializing for domain: ${this.domain} (WebsiteID: ${this.websiteId})`);

    try {
      // 1. Auto-detect framework
      this.frameworkMeta = this.customFramework 
        ? { framework: this.customFramework, version: 'custom', buildSystem: 'custom', routeSystem: 'custom' }
        : detectFramework(process.cwd());
      
      this.log('Framework auto-detected:', this.frameworkMeta);

      // 2. Register website via connection handshake
      await this._registerWebsite();

      // 3. Connect real-time WebSockets
      this._connectWebSocket();

      // 4. Scan routes & active modules, and sync them
      await this.sync();

      // 5. In development environment, watch directory files for changes
      const isDev = typeof process !== 'undefined' && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV);
      if (isDev && typeof window === 'undefined') {
        this._setupFileWatcher();
      }

      this.initialized = true;
      this.emit('ready');
      this.log('SDK initialized successfully.');
    } catch (error) {
      this.isOffline = true;
      this.initialized = true;
      console.warn(`[GlobalBackendSDK WARNING] Initialization failed: ${error.message}. Entering degraded offline mode.`);
      this.emit('error', error);
    }
  }

  /**
   * Performs the primary discovery scan and synchronizes routes/modules with backend.
   */
  async sync() {
    this.log('Starting sync discovery scan...');
    try {
      // Discovered paths
      const discoveredRoutes = await scanNextJsRoutes(process.cwd());
      const discoveredModules = await discoverSiteModules(process.cwd());

      this.log(`Discovered ${discoveredRoutes.length} routes and modules:`, discoveredModules);

      // Synchronize with backend API endpoints
      await this._enqueueSyncRequest('/api/routes/sync', {
        websiteId: this.websiteId,
        routes: discoveredRoutes
      });

      await this._enqueueSyncRequest('/api/global/modules', {
        websiteId: this.websiteId,
        modules: discoveredModules
      });

      this.emit('sync:complete', { routes: discoveredRoutes, modules: discoveredModules });
      this.log('Synchronization completed successfully.');
      return { routes: discoveredRoutes, modules: discoveredModules };
    } catch (error) {
      this.log('Synchronization failed:', error.message);
      this.emit('syncFailed', error);
      throw error;
    }
  }

  /**
   * Manually connect/reconnect WebSocket connection.
   */
  connect() {
    if (this.socketWrapper) {
      this.socketWrapper.connect();
    } else {
      this._connectWebSocket();
    }
  }

  /**
   * Manually disconnect WebSocket connection.
   */
  disconnect() {
    if (this.socketWrapper) {
      this.socketWrapper.disconnect();
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Returns current SDK status.
   */
  status() {
    return {
      initialized: this.initialized,
      framework: this.frameworkMeta?.framework || 'unknown',
      connected: this.socketWrapper ? this.socketWrapper.isConnected() : false,
      isOffline: this.isOffline,
      websiteId: this.websiteId,
      domain: this.domain,
      backendUrl: this.backendUrl,
      syncQueueLength: this.syncQueue.length
    };
  }

  /**
   * Performs handshake connection request with the Global Backend.
   * @private
   */
  async _registerWebsite() {
    const registerUrl = `${this.backendUrl}/api/websites/connect`;
    this.log(`Sending connection handshake: ${registerUrl}`);

    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.apiKey,
        websiteId: this.websiteId,
        domain: this.domain,
        apiUrl: this.apiUrl,
        framework: this.frameworkMeta?.framework || 'nextjs',
        frameworkVersion: this.frameworkMeta?.version || 'unknown',
        sdkVersion: '1.0.0',
        environment: typeof process !== 'undefined' ? (process.env.NODE_ENV || 'development') : 'development'
      })
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || `Handshake returned status code ${response.status}`);
    }

    this.syncToken = json.syncToken;
    this.log('Handshake successful. Token acquired.');
  }

  /**
   * Setup WebSockets communication wrapper.
   * @private
   */
  _connectWebSocket() {
    this.log(`Establishing WebSocket link with: ${this.backendUrl}`);

    this.socketWrapper = createWebSocketConnection(
      this.backendUrl,
      this.websiteId,
      {
        onConnect: () => {
          this.log('Real-time connection active.');
          this.emit('connected');
          this._handleOnlineStatus(true);
        },
        onDisconnect: (reason) => {
          this.log(`Real-time connection disconnected: ${reason}`);
          this.emit('disconnected', reason);
        },
        onReconnect: (attempt) => {
          this.log(`Real-time connection restored on attempt ${attempt}.`);
          this.emit('reconnect', attempt);
          this._handleOnlineStatus(true);
        },
        onError: (err) => {
          this.log('WebSocket error:', err.message);
          this.emit('error', err);
        },
        onEvent: (event, data) => {
          this.log(`WebSocket incoming event [${event}]:`, data);
          this.emit(event, data);
          // Standard trigger events matching user specification
          if (event === 'route:updated' || event === 'route:created' || event === 'route:deleted') {
            this.emit('route:update', data);
          }
          if (event === 'page:update') {
            this.emit('page:update', data);
          }
        }
      },
      this.debugMode
    );
  }

  /**
   * Watches website folders in development mode for live reloading and route sync.
   * @private
   */
  _setupFileWatcher() {
    this.log('Setting up development file watch sync...');
    
    // Scan standard folders
    const pathsToWatch = ['app', 'pages', 'components', 'src/app', 'src/pages', 'src/components']
      .map(p => path.join(process.cwd(), p))
      .filter(p => fs.existsSync(p));

    if (pathsToWatch.length === 0) return;

    let debounceTimeout = null;

    const changeCallback = (eventType, filename) => {
      if (!filename) return;

      const normalizedFilename = filename.replace(/\\/g, '/');

      // Ignore Next.js internal files, build artifacts, or node_modules
      if (
        normalizedFilename.includes('.next') ||
        normalizedFilename.includes('node_modules') ||
        normalizedFilename.includes('.git') ||
        normalizedFilename.includes('dist')
      ) {
        return;
      }

      // Only trigger on actual source code/config file changes (ignore directories or temp/lock files)
      const ext = path.extname(normalizedFilename).toLowerCase();
      const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html'];
      if (!validExtensions.includes(ext)) {
        return;
      }

      this.log(`File change detected: [${eventType}] ${normalizedFilename}. Synchronizing...`);
      
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        this.sync().catch(err => {
          this.log('Background watch sync failed:', err.message);
        });
      }, 3000); // 3s debounce to allow multiple files to settle on Windows/OneDrive
    };

    try {
      // Create watches
      pathsToWatch.forEach(dir => {
        fs.watch(dir, { recursive: true }, changeCallback);
      });
      this.log(`Watching directories: ${pathsToWatch.join(', ')}`);
    } catch (e) {
      this.log('Failed to initialize file watcher (recursive watch may not be supported):', e.message);
    }
  }

  /**
   * Monitor online status changes.
   * @private
   */
  _handleOnlineStatus(online) {
    if (online && this.isOffline) {
      this.isOffline = false;
      this.log('Network online. Re-syncing enqueued updates.');
      this._flushSyncQueue();
    } else if (!online && !this.isOffline) {
      this.isOffline = true;
      this.log('Network offline. Queuing all sync transactions.');
    }
  }

  /**
   * Enqueues or posts sync payload.
   * @private
   */
  async _enqueueSyncRequest(endpoint, payload) {
    if (this.isOffline) {
      this.log(`Offline: Enqueueing payload for ${endpoint}`);
      this.syncQueue.push({ endpoint, payload });
      return;
    }

    try {
      await this._post(endpoint, payload);
    } catch (error) {
      this.log(`Sync request failed. Enqueueing for retry: ${error.message}`);
      this.syncQueue.push({ endpoint, payload });
      this.emit('syncFailed', error);
      throw error;
    }
  }

  /**
   * Flush enqueued offline operations.
   * @private
   */
  async _flushSyncQueue() {
    if (this.syncQueue.length === 0) return;
    this.log(`Flushing sync queue. Queue size: ${this.syncQueue.length}`);

    const tempQueue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of tempQueue) {
      try {
        await this._post(item.endpoint, item.payload);
      } catch (err) {
        this.log(`Failed flushing item: ${item.endpoint}. Putting back into queue.`);
        this.syncQueue.push(item);
      }
    }
  }

  /**
   * Perform HTTP POST request to backend APIs.
   * @private
   */
  async _post(endpoint, body) {
    const response = await fetch(`${this.backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.syncToken}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || `Server status ${response.status}`);
    }
    return json;
  }
}
