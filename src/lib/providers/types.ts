import { Product, ProductCreate, ProductUpdate, SyncStatus } from '@/types/product';

export interface SyncResult {
  success: boolean;
  syncStatus: SyncStatus;
  message: string;
  wooCommerceId?: number;
  errorDetails?: string;
  simulated?: boolean;
}

export interface ConnectionTestResult {
  connected: boolean;
  provider: 'demo' | 'woocommerce';
  message: string;
  storeName?: string;
  version?: string;
  environmentDetails?: string;
  error?: string;
}

export interface ICatalogProvider {
  name: string;
  isDemo: boolean;
  syncProduct(product: Product): Promise<SyncResult>;
  testConnection(): Promise<ConnectionTestResult>;
  importProducts(): Promise<Product[]>;
}
