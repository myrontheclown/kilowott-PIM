import { WooCommerceCredentials } from '@/types/product';
import { WooCommerceApiProduct } from './product-mapper';

export class WooCommerceClient {
  private storeUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(credentials?: Partial<WooCommerceCredentials>) {
    this.storeUrl = (credentials?.storeUrl || process.env.WOOCOMMERCE_STORE_URL || '').replace(/\/$/, '');
    this.consumerKey = credentials?.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY || '';
    this.consumerSecret = credentials?.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET || '';
  }

  public hasCredentials(): boolean {
    return Boolean(
      this.storeUrl &&
      this.storeUrl.startsWith('http') &&
      this.consumerKey &&
      this.consumerSecret
    );
  }

  private getAuthHeader(): string {
    const token = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    return `Basic ${token}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.hasCredentials()) {
      throw new Error('WooCommerce credentials are missing or incomplete. Please configure Store URL, Consumer Key, and Consumer Secret in Settings.');
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.storeUrl}/wp-json/wc/v3${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'CatalogSync-PIM/1.0',
      ...(options.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Unexpected non-JSON response from WooCommerce server (HTTP ${response.status}): ${text.slice(0, 150)}`);
      }

      if (!response.ok) {
        let errorMessage = `WooCommerce API Error (HTTP ${response.status})`;
        if (data && typeof data === 'object') {
          if (data.message) {
            errorMessage = `${data.message} (${data.code || response.status})`;
          } else if (data.code) {
            errorMessage = `Error code: ${data.code}`;
          }
        }

        if (response.status === 401) {
          errorMessage = 'Authentication failed: Invalid Consumer Key or Consumer Secret';
        } else if (response.status === 404) {
          errorMessage = 'Endpoint not found: Verify store URL and that WooCommerce REST API is enabled';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden: Consumer Key does not have read/write permissions';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = data;
        throw error;
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`WooCommerce connection timed out after 10s connecting to ${this.storeUrl}`);
      }
      throw err;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Query system status or 1 product to verify authentication and read access
      const products = await this.request<any[]>('/products?per_page=1');
      return {
        success: true,
        message: 'WooCommerce connection verified successfully. Remote REST API is responsive.',
        data: {
          storeUrl: this.storeUrl,
          sampleCount: Array.isArray(products) ? products.length : 0,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to connect to WooCommerce store',
        data: err.details,
      };
    }
  }

  async getProducts(perPage = 20, page = 1): Promise<WooCommerceApiProduct[]> {
    return this.request<WooCommerceApiProduct[]>(`/products?per_page=${perPage}&page=${page}`);
  }

  async getProduct(id: number): Promise<WooCommerceApiProduct> {
    return this.request<WooCommerceApiProduct>(`/products/${id}`);
  }

  async createProduct(payload: WooCommerceApiProduct): Promise<WooCommerceApiProduct> {
    return this.request<WooCommerceApiProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProduct(id: number, payload: Partial<WooCommerceApiProduct>): Promise<WooCommerceApiProduct> {
    return this.request<WooCommerceApiProduct>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}
