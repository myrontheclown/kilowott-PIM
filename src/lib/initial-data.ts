import { Product } from '@/types/product';
import { calculateProductCompleteness } from './completeness';

const rawProducts: Array<{
  id: string;
  wooCommerceId?: number;
  name: string;
  sku: string;
  description: string;
  shortDescription?: string;
  regularPrice: number;
  salePrice?: number;
  stockQuantity: number;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  category: string;
  imageUrl: string;
  attributes: Record<string, string | number | boolean>;
  status: 'draft' | 'published';
  syncStatus: 'pending' | 'synced' | 'failed' | 'simulated';
  lastSyncTimestamp?: string;
  lastSyncError?: string;
}> = [
  // 1. Clothing - 100% complete & published, synced
  {
    id: 'prod-cloth-01',
    wooCommerceId: 1042,
    name: 'Merino Wool Crewneck Sweater',
    sku: 'APP-MRN-001',
    description: 'Crafted from 100% extrafine Australian merino wool. Features ribbed cuffs, collar, and hem with natural thermal regulation.',
    shortDescription: 'Extrafine merino wool luxury sweater.',
    regularPrice: 129.00,
    salePrice: 99.00,
    stockQuantity: 42,
    stockStatus: 'instock',
    category: 'clothing',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80',
    attributes: {
      brand: 'Nordic Atelier',
      size: 'L',
      color: 'Charcoal Heather',
      material: '100% Merino Wool',
      gender: 'Unisex',
    },
    status: 'published',
    syncStatus: 'synced',
    lastSyncTimestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  // 2. Clothing - Incomplete missing material and color (to showcase validation & completeness)
  {
    id: 'prod-cloth-02',
    name: 'Raw Selvedge Denim Jacket',
    sku: 'APP-DNM-002',
    description: 'Heavyweight 14oz Japanese selvedge denim jacket with custom brass hardware and dual chest pockets.',
    regularPrice: 185.00,
    stockQuantity: 18,
    stockStatus: 'instock',
    category: 'clothing',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
    attributes: {
      brand: 'Kuroki Mills',
      size: 'XL',
      // Missing required: color, material!
    },
    status: 'draft',
    syncStatus: 'pending',
  },
  // 3. Electronics - 100% complete, simulated sync
  {
    id: 'prod-elec-01',
    name: 'AcousticPro ANC Wireless Headphones',
    sku: 'ELC-ANC-099',
    description: 'Studio-grade hybrid active noise cancellation with 40mm beryllium drivers, multipoint Bluetooth 5.3, and 45-hour playback.',
    shortDescription: 'Hybrid ANC headphones with 45h battery life.',
    regularPrice: 249.99,
    salePrice: 199.99,
    stockQuantity: 65,
    stockStatus: 'instock',
    category: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    attributes: {
      brand: 'SoundForm',
      warranty: '2 Years Manufacturer',
      connectivity: 'Bluetooth 5.3',
      batteryLife: '45',
      modelNumber: 'SF-ANC99',
    },
    status: 'published',
    syncStatus: 'simulated',
    lastSyncTimestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  // 4. Electronics - Failed sync attempt (to showcase retry & error resolution)
  {
    id: 'prod-elec-02',
    name: 'Mechanical Ergo Split Keyboard',
    sku: 'ELC-KBD-770',
    description: 'Split ergonomic mechanical keyboard with hot-swappable switches, OLED thumb cluster displays, and per-key RGB backlighting.',
    regularPrice: 169.50,
    stockQuantity: 9,
    stockStatus: 'instock',
    category: 'electronics',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    attributes: {
      brand: 'ErgoType',
      warranty: '1 Year Limited',
      connectivity: 'USB-C',
      modelNumber: 'ET-SPLIT7',
    },
    status: 'published',
    syncStatus: 'failed',
    lastSyncTimestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastSyncError: 'HTTP 401: Invalid WooCommerce consumer credentials or expired token',
  },
  // 5. Home Goods - 100% complete, pending sync
  {
    id: 'prod-home-01',
    name: 'Artisan Solid Walnut Serving Board',
    sku: 'HOM-WLN-301',
    description: 'Hand-carved from sustainably sourced American black walnut with organic food-safe beeswax finish and juice groove.',
    regularPrice: 78.00,
    stockQuantity: 34,
    stockStatus: 'instock',
    category: 'home-goods',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
    attributes: {
      material: 'Solid American Black Walnut',
      dimensions: '48 x 28 x 3 cm',
      color: 'Natural Dark Walnut',
      careInstructions: 'Hand wash with mild soap. Oil with mineral oil monthly.',
      weight: '1.8',
    },
    status: 'published',
    syncStatus: 'pending',
  },
  // 6. Home Goods - Incomplete (missing dimensions and description too short)
  {
    id: 'prod-home-02',
    name: 'Minimalist Ceramic Vase',
    sku: 'HOM-VAS-102',
    description: 'Handmade vase.',
    regularPrice: 45.00,
    stockQuantity: 12,
    stockStatus: 'instock',
    category: 'home-goods',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
    attributes: {
      material: 'Stoneware Clay',
      // Missing required: dimensions!
    },
    status: 'draft',
    syncStatus: 'pending',
  },
  // 7. Beauty - 100% complete, synced
  {
    id: 'prod-bt-01',
    wooCommerceId: 1045,
    name: 'Botanical Radiance Face Elixir',
    sku: 'BTY-ELX-505',
    description: 'Cold-pressed botanical serum enriched with squalane, rosehip oil, and vitamin E to restore skin elasticity and natural glow.',
    regularPrice: 62.00,
    salePrice: 52.00,
    stockQuantity: 50,
    stockStatus: 'instock',
    category: 'beauty',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-2169eb9e7f8e?w=600&auto=format&fit=crop&q=80',
    attributes: {
      brand: 'Aura Botanics',
      volume: '30 ml',
      ingredients: 'Organic Squalane, Rosa Canina Seed Oil, Tocopherol, Frankincense',
      skinType: 'All Skin Types',
    },
    status: 'published',
    syncStatus: 'synced',
    lastSyncTimestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export const INITIAL_PRODUCTS: Product[] = rawProducts.map((p) => {
  const completeness = calculateProductCompleteness(p);
  const now = new Date().toISOString();
  return {
    ...p,
    completenessScore: completeness.score,
    missingFields: completeness.missingFields,
    createdAt: now,
    updatedAt: now,
  };
});

export const INITIAL_SYNC_LOGS = [
  {
    id: 'log-001',
    productId: 'prod-elec-02',
    productName: 'Mechanical Ergo Split Keyboard',
    sku: 'ELC-KBD-770',
    provider: 'woocommerce' as const,
    status: 'failed' as const,
    action: 'update' as const,
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    message: 'WooCommerce remote rejected synchronization',
    errorDetails: 'HTTP 401: Invalid WooCommerce consumer credentials or expired token',
  },
  {
    id: 'log-002',
    productId: 'prod-elec-01',
    productName: 'AcousticPro ANC Wireless Headphones',
    sku: 'ELC-ANC-099',
    provider: 'demo' as const,
    status: 'simulated' as const,
    action: 'create' as const,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    message: 'Simulated sync: Product data validated and simulated catalog updated',
  },
  {
    id: 'log-003',
    productId: 'prod-cloth-01',
    productName: 'Merino Wool Crewneck Sweater',
    sku: 'APP-MRN-001',
    provider: 'woocommerce' as const,
    status: 'success' as const,
    action: 'update' as const,
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    message: 'WooCommerce remote product #1042 successfully updated',
    wooCommerceId: 1042,
  },
  {
    id: 'log-004',
    productId: 'prod-bt-01',
    productName: 'Botanical Radiance Face Elixir',
    sku: 'BTY-ELX-505',
    provider: 'woocommerce' as const,
    status: 'success' as const,
    action: 'create' as const,
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    message: 'WooCommerce remote product #1045 successfully created',
    wooCommerceId: 1045,
  },
];

