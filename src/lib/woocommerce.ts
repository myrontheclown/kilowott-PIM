import { WooCommerceCredentials } from '@/types/product';
import { WooCommerceApiProduct } from './product-mapper';

// Allow self-signed certificates in local development environments (e.g. LocalWP https://*.local)
if (process.env.NODE_ENV !== 'production' && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export class WooCommerceClient {
  private storeUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(credentials?: Partial<WooCommerceCredentials>) {
    let rawUrl = (
      credentials?.storeUrl !== undefined
        ? credentials.storeUrl
        : (process.env.WOOCOMMERCE_STORE_URL || '')
    ).trim();

    // Normalize protocol if missing
    if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `http://${rawUrl}`;
    }
    this.storeUrl = rawUrl.replace(/\/+$/, '');
    this.consumerKey = (
      credentials?.consumerKey !== undefined
        ? credentials.consumerKey
        : (process.env.WOOCOMMERCE_CONSUMER_KEY || '')
    ).trim();
    this.consumerSecret = (
      credentials?.consumerSecret !== undefined
        ? credentials.consumerSecret
        : (process.env.WOOCOMMERCE_CONSUMER_SECRET || '')
    ).trim();
  }

  public getStoreUrl(): string {
    return this.storeUrl;
  }

  public hasCredentials(): boolean {
    return Boolean(
      this.storeUrl &&
      (this.storeUrl.startsWith('http://') || this.storeUrl.startsWith('https://')) &&
      this.consumerKey &&
      this.consumerSecret
    );
  }

  public getMaskedCredentials(): { storeUrl: string; hasKey: boolean; hasSecret: boolean; maskedKey?: string } {
    return {
      storeUrl: this.storeUrl,
      hasKey: Boolean(this.consumerKey),
      hasSecret: Boolean(this.consumerSecret),
      maskedKey: this.consumerKey
        ? `${this.consumerKey.slice(0, 6)}...${this.consumerKey.slice(-4)}`
        : undefined,
    };
  }

  private getAuthHeader(): string {
    const token = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    return `Basic ${token}`;
  }

  /**
   * Sanitizes any sensitive credential strings from error messages
   */
  private sanitizeErrorMessage(msg: string): string {
    let sanitized = msg;
    if (this.consumerSecret && this.consumerSecret.length > 4) {
      sanitized = sanitized.replaceAll(this.consumerSecret, '[REDACTED_SECRET]');
    }
    if (this.consumerKey && this.consumerKey.length > 4) {
      sanitized = sanitized.replaceAll(this.consumerKey, '[REDACTED_KEY]');
    }
    return sanitized;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; headers: Headers }> {
    if (!this.hasCredentials()) {
      throw new Error(
        'WooCommerce credentials are missing or incomplete. Ensure WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET are configured in .env.local.'
      );
    }

    // SSRF Guard: Only allow valid HTTP / HTTPS destinations
    try {
      const parsedUrl = new URL(this.storeUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error(`Invalid protocol '${parsedUrl.protocol}'. Only http:// and https:// are supported.`);
      }
      if (parsedUrl.hostname === '169.254.169.254' || parsedUrl.hostname === 'metadata.google.internal') {
        throw new Error('Access to cloud metadata endpoints is prohibited.');
      }
    } catch (e: any) {
      throw new Error(`Invalid store URL '${this.storeUrl}': ${e.message}`);
    }

    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const urlObj = new URL(`${this.storeUrl}/wp-json/wc/v3/${cleanEndpoint}`);

    // WooCommerce REST API v3 supports query string authentication. Over HTTP, WooCommerce requires
    // query parameters because Basic Auth over HTTP is blocked by default in WordPress:
    if (!urlObj.searchParams.has('consumer_key')) {
      urlObj.searchParams.set('consumer_key', this.consumerKey);
      urlObj.searchParams.set('consumer_secret', this.consumerSecret);
    }

    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'CatalogSync-PIM/1.0',
      ...(options.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    const timeoutMs = 15000; // 15 seconds timeout
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(urlObj.toString(), {
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
        const snippet = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        throw new Error(
          `Received non-JSON response from ${this.storeUrl} (HTTP ${response.status}). This often indicates a WordPress permalink issue, redirection, or PHP fatal error. Response snippet: ${snippet || '(empty)'}`
        );
      }

      if (!response.ok) {
        let errorMessage = `WooCommerce API Error (HTTP ${response.status})`;

        if (data && typeof data === 'object') {
          if (data.code === 'woocommerce_rest_cannot_view') {
            errorMessage = `Permission denied (HTTP 401): 'Sorry, you cannot list resources.' In WordPress admin, go to WooCommerce > Settings > Advanced > REST API, edit your API Key, and ensure the 'User' is an Administrator with 'Read/Write' permissions.`;
          } else if (data.code === 'woocommerce_rest_cannot_create') {
            errorMessage = `Permission denied (HTTP 401): 'Sorry, you cannot create resources.' Ensure your API Key permissions are set to 'Read/Write' in WooCommerce > Settings > Advanced > REST API.`;
          } else if (data.code === 'woocommerce_rest_cannot_edit') {
            errorMessage = `Permission denied (HTTP 401): 'Sorry, you cannot edit this resource.' Ensure your API Key user has permissions to modify products.`;
          } else if (data.message) {
            errorMessage = `${data.message} (code: ${data.code || response.status})`;
          } else if (data.code) {
            errorMessage = `WooCommerce error code: ${data.code}`;
          }
        }

        if (response.status === 401 && !data?.code) {
          errorMessage = 'Authentication failed (HTTP 401): Invalid Consumer Key or Consumer Secret. Verify credentials in WooCommerce > Settings > Advanced > REST API.';
        } else if (response.status === 403 && !data?.code) {
          errorMessage = 'Permission denied (HTTP 403): Ensure the API key has "Read/Write" permissions (not Read-only).';
        } else if (response.status === 404 && !data?.code) {
          errorMessage = `Endpoint not found (HTTP 404) at ${this.storeUrl}/wp-json/wc/v3/${cleanEndpoint}. Ensure WordPress permalinks are enabled (not "Plain") in Settings > Permalinks, and WooCommerce is active.`;
        }

        const error = new Error(this.sanitizeErrorMessage(errorMessage));
        (error as any).status = response.status;
        (error as any).details = data;
        throw error;
      }

      return { data: data as T, headers: response.headers };
    } catch (err: any) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        throw new Error(
          `Connection timed out after ${timeoutMs / 1000}s connecting to ${this.storeUrl}. Ensure LocalWP is running and responsive.`
        );
      }

      // Diagnose low-level network errors
      const errCode = err.code || err.cause?.code;
      const rawMessage = String(err.message || err.cause?.message || err);

      if (errCode === 'ECONNREFUSED' || rawMessage.includes('ECONNREFUSED')) {
        throw new Error(
          `Connection refused at ${this.storeUrl}. Verify that your LocalWP site is started and the port/domain is correct.`
        );
      }

      if (errCode === 'ENOTFOUND' || rawMessage.includes('ENOTFOUND')) {
        throw new Error(
          `Unable to resolve host at ${this.storeUrl}. Check your LocalWP domain name and ensure your system hosts file includes this domain.`
        );
      }

      if (
        errCode === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
        errCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        rawMessage.includes('self-signed') ||
        rawMessage.includes('certificate')
      ) {
        throw new Error(
          `SSL certificate verification issue connecting to ${this.storeUrl}. If using LocalWP HTTPS with self-signed certs, try using the HTTP URL (e.g. http://...) or trust the certificate in LocalWP.`
        );
      }

      throw new Error(this.sanitizeErrorMessage(err.message || 'Unknown network error'));
    }
  }

  /**
   * Tests connection to WooCommerce store by verifying API access
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Query 1 product to verify authentication and read permissions
      const { data: products, headers } = await this.request<any[]>('products?per_page=1');
      const totalCount = headers.get('x-wp-total') || '0';

      return {
        success: true,
        message: 'WooCommerce connection verified successfully. Remote REST API v3 is responsive and authenticated.',
        data: {
          storeUrl: this.storeUrl,
          totalProductsInStore: parseInt(totalCount, 10) || (Array.isArray(products) ? products.length : 0),
          verifiedAt: new Date().toISOString(),
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

  /**
   * Fetches a single page of products
   */
  async getProducts(perPage = 20, page = 1): Promise<{ products: WooCommerceApiProduct[]; totalPages: number; total: number }> {
    const { data, headers } = await this.request<WooCommerceApiProduct[]>(`products?per_page=${perPage}&page=${page}`);
    const totalPages = parseInt(headers.get('x-wp-totalpages') || '1', 10);
    const total = parseInt(headers.get('x-wp-total') || String(data.length), 10);

    return {
      products: Array.isArray(data) ? data : [],
      totalPages,
      total,
    };
  }

  /**
   * Fetches all products with automated pagination
   */
  async getAllProducts(perPage = 50, maxPages = 10): Promise<{ products: WooCommerceApiProduct[]; totalCount: number; pagesFetched: number }> {
    let currentPage = 1;
    let allProducts: WooCommerceApiProduct[] = [];
    let totalExpected = 0;

    while (currentPage <= maxPages) {
      const { data, headers } = await this.request<WooCommerceApiProduct[]>(
        `products?per_page=${perPage}&page=${currentPage}`
      );

      const totalPages = parseInt(headers.get('x-wp-totalpages') || '1', 10);
      totalExpected = parseInt(headers.get('x-wp-total') || '0', 10);

      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      allProducts = allProducts.concat(data);

      if (currentPage >= totalPages) {
        break;
      }
      currentPage++;
    }

    return {
      products: allProducts,
      totalCount: totalExpected || allProducts.length,
      pagesFetched: currentPage,
    };
  }

  async getProduct(id: number): Promise<WooCommerceApiProduct> {
    const { data } = await this.request<WooCommerceApiProduct>(`products/${id}`);
    return data;
  }

  async createProduct(payload: WooCommerceApiProduct): Promise<WooCommerceApiProduct> {
    const { data } = await this.request<WooCommerceApiProduct>('products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  }

  async updateProduct(id: number, payload: Partial<WooCommerceApiProduct>): Promise<WooCommerceApiProduct> {
    const { data } = await this.request<WooCommerceApiProduct>(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  }
}
