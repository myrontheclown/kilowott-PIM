import { Product, WooCommerceCredentials } from '@/types/product';
import { ConnectionTestResult, ICatalogProvider, SyncResult } from './types';

export class WooCommerceProvider implements ICatalogProvider {
  name = 'WooCommerce Live REST API';
  isDemo = false;
  private credentials?: WooCommerceCredentials;

  constructor(credentials?: WooCommerceCredentials) {
    this.credentials = credentials;
  }

  setCredentials(credentials?: WooCommerceCredentials) {
    this.credentials = credentials;
  }

  async syncProduct(product: Product): Promise<SyncResult> {
    try {
      const isUpdate = Boolean(product.wooCommerceId);
      const url = isUpdate
        ? `/api/woocommerce/products/${product.wooCommerceId}`
        : `/api/woocommerce/products`;

      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          credentials: this.credentials,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errorMsg = data.error || `Remote synchronization failed (HTTP ${res.status})`;
        return {
          success: false,
          syncStatus: 'failed',
          simulated: false,
          message: errorMsg,
          errorDetails: data.issues ? JSON.stringify(data.issues) : errorMsg,
        };
      }

      return {
        success: true,
        syncStatus: 'synced',
        simulated: false,
        message: data.message || `Successfully synchronized with WooCommerce`,
        wooCommerceId: data.wooCommerceId || product.wooCommerceId,
      };
    } catch (err: any) {
      return {
        success: false,
        syncStatus: 'failed',
        simulated: false,
        message: err.message || 'Network error attempting to contact WooCommerce integration endpoint',
        errorDetails: String(err),
      };
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const res = await fetch('/api/woocommerce/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.credentials || {}),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.connected) {
        return {
          connected: true,
          provider: 'woocommerce',
          message: data.message || 'WooCommerce API connection confirmed active',
          storeName: data.storeUrl || 'Connected WooCommerce Store',
          version: 'WooCommerce REST API v3',
        };
      }

      return {
        connected: false,
        provider: 'woocommerce',
        message: data.message || 'Unable to establish authenticated connection to WooCommerce',
        error: data.error || data.message,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'woocommerce',
        message: err.message || 'Connection test request failed',
        error: String(err),
      };
    }
  }

  async importProducts(): Promise<Product[]> {
    const query = new URLSearchParams();
    if (this.credentials?.storeUrl) query.set('storeUrl', this.credentials.storeUrl);
    if (this.credentials?.consumerKey) query.set('consumerKey', this.credentials.consumerKey);
    if (this.credentials?.consumerSecret) query.set('consumerSecret', this.credentials.consumerSecret);

    const res = await fetch(`/api/woocommerce/products?${query.toString()}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to import remote products from WooCommerce store');
    }

    return data.products || [];
  }
}

export const wooCommerceProvider = new WooCommerceProvider();
