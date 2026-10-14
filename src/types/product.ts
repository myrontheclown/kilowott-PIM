export type ProductCategory = 
  | 'clothing'
  | 'electronics'
  | 'home-goods'
  | 'beauty'
  | 'groceries'
  | string;

export type ProductStatus = 'draft' | 'published';

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'simulated';

export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

export interface AttributeDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[]; // for select type
  required: boolean;
  unit?: string;
  description?: string;
}

export interface CategoryRule {
  category: ProductCategory;
  label: string;
  description: string;
  attributes: AttributeDefinition[];
}

export interface ProductAttributeValue {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
}

export interface Product {
  id: string; // Internal UUID
  wooCommerceId?: number; // Remote WooCommerce product ID
  name: string;
  sku: string;
  description: string;
  shortDescription?: string;
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  category: ProductCategory;
  imageUrl: string;
  attributes: Record<string, string | number | boolean>;
  status: ProductStatus;
  completenessScore: number; // 0 - 100
  missingFields: string[];
  syncStatus: SyncStatus;
  lastSyncTimestamp?: string;
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCreate = Omit<Product, 'id' | 'completenessScore' | 'missingFields' | 'syncStatus' | 'createdAt' | 'updatedAt'>;

export type ProductUpdate = Partial<ProductCreate>;

export interface SyncLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  provider: 'demo' | 'woocommerce';
  status: 'success' | 'failed' | 'simulated';
  action: 'create' | 'update' | 'import';
  timestamp: string;
  message: string;
  wooCommerceId?: number;
  errorDetails?: string;
}

export interface WooCommerceCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export type ProviderMode = 'demo' | 'woocommerce';
