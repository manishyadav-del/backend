import { EventEmitter } from 'events';

export interface SDKConfig {
  apiKey: string;
  websiteId: string;
  backendUrl?: string;
  domain?: string;
  apiUrl?: string;
  framework?: string;
  debug?: boolean;
}

export interface FrameworkMetadata {
  framework: string;
  version: string;
  buildSystem: string;
  routeSystem: string;
}

export interface SDKStatus {
  initialized: boolean;
  framework: string;
  connected: boolean;
  isOffline: boolean;
  websiteId: string;
  domain: string;
  backendUrl: string;
  syncQueueLength: number;
}

export class GlobalBackendSDK extends EventEmitter {
  constructor(config: SDKConfig);
  apiKey: string;
  websiteId: string;
  backendUrl: string;
  domain: string;
  apiUrl: string;
  frameworkMeta: FrameworkMetadata | null;
  initialized: boolean;
  components: Record<string, any>;
  isOffline: boolean;

  debug(flag: boolean): void;
  registerComponent(type: string, component: any): void;
  initialize(): Promise<void>;
  sync(): Promise<{ routes: string[]; modules: string[] }>;
  connect(): void;
  disconnect(): void;
  status(): SDKStatus;
}

export interface ConnectorOptions {
  secret?: string;
  onSync?: (body: any) => Promise<void> | void;
  onPull?: (type: string, queryParams: any) => Promise<any> | any;
  onPageUpdate?: (action: string, page: any) => Promise<void> | void;
  onRouteUpdate?: (action: string, route: any) => Promise<void> | void;
  onMediaUpdate?: (action: string, media: any) => Promise<void> | void;
  onModuleSync?: (moduleKey: string, data: any) => Promise<void> | void;
}

export function createConnector(options?: ConnectorOptions): (req: any, res?: any) => Promise<any>;
