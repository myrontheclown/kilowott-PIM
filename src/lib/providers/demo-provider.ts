import { Product } from '@/types/product';
import { fetchDummyJsonProducts } from '../dummyjson';
import { ConnectionTestResult, ICatalogProvider, SyncResult } from './types';

export class DemoProvider implements ICatalogProvider {
  name = 'Demo Mode (Simulated)';
  isDemo = true;

  async syncProduct(product: Product): Promise<SyncResult> {
    // Simulate real network delay for UX realism
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Demo sync always clearly notes simulation
    return {
      success: true,
      syncStatus: 'simulated',
      simulated: true,
      message: `Simulated sync: Verified attributes for '${product.name}' and mirrored to local catalog.`,
      wooCommerceId: product.wooCommerceId || Math.floor(1000 + Math.random() * 9000),
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      connected: true,
      provider: 'demo',
      message: 'Demo mode active. Synchronization will be simulated locally.',
      storeName: 'CatalogSync Demo Sandbox Store',
      version: 'Mock WC v3.8.0',
      environmentDetails: 'Local Browser + Memory Persistence',
    };
  }

  async importProducts(): Promise<Product[]> {
    return await fetchDummyJsonProducts(6);
  }
}

export const demoProvider = new DemoProvider();
