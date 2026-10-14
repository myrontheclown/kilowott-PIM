import { Product, WooCommerceCredentials } from '@/types/product';
import { ConnectionTestResult, ICatalogProvider, SyncResult } from './types';

export class WooCommerceProvider implements ICatalogProvider {
  name = 'WooCommerce Live REST API';
  isDemo = false;
  private customStoreUrl?: string;

  constructor(storeUrl?: string) {
    this.customStoreUrl = storeUrl;
  }

  setStoreUrl(url?: string) {
    this.customStoreUrl = url;
  }

  async syncProduct(product: Product): Promise<SyncResult> {
    try {
      // Use existing WooCommerce ID for remote update, or POST for new remote product
      const isUpdate = Boolean(product.wooCommerceId && typeof product.wooCommerceId === 'number' && product.wooCommerceId > 0);
      const url = isUpdate
        ? `/api/woocommerce/products/${product.wooCommerceId}`
        : `/api/woocommerce/products`;

      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          credentials: this.customStoreUrl ? { storeUrl: this.customStoreUrl } : undefined,
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
        message: err.message || 'Network error communicating with WooCommerce API route',
        errorDetails: String(err),
      };
    }
  }

  async testConnection(customCredentials?: Partial<WooCommerceCredentials>): Promise<ConnectionTestResult> {
    try {
      const res = await fetch('/api/woocommerce/test', {
        method: customCredentials ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: customCredentials ? JSON.stringify(customCredentials) : undefined,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.connected) {
        return {
          connected: true,
          provider: 'woocommerce',
          message: data.message || 'WooCommerce API connection confirmed active.',
          storeName: data.storeUrl || 'Connected WooCommerce Store',
          version: 'WooCommerce REST API v3',
          environmentDetails: data.details
            ? `${data.details.totalProductsInStore} remote products found`
            : undefined,
        };
      }

      return {
        connected: false,
        provider: 'woocommerce',
        message: data.message || 'Unable to establish authenticated connection to WooCommerce',
        storeName: data.storeUrl,
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
    const query = new URLSearchParams({ all: 'true' });
    if (this.customStoreUrl) {
      query.set('storeUrl', this.customStoreUrl);
    }

    const res = await fetch(`/api/woocommerce/products?${query.toString()}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.error || `Failed to import remote products (HTTP ${res.status})`);
    }

    return data.products || [];
  }
}

export const wooCommerceProvider = new WooCommerceProvider();
