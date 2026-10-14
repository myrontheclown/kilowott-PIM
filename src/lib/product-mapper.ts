import { Product, ProductCategory, StockStatus } from '@/types/product';
import { calculateProductCompleteness } from './completeness';

export interface WooCommerceApiProduct {
  id?: number;
  name: string;
  type?: string;
  regular_price?: string;
  sale_price?: string;
  price?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: StockStatus;
  status?: 'publish' | 'draft' | 'pending' | 'private';
  categories?: Array<{ id?: number; name: string; slug?: string }>;
  images?: Array<{ id?: number; src: string; alt?: string }>;
  attributes?: Array<{
    id?: number;
    name: string;
    position?: number;
    visible?: boolean;
    variation?: boolean;
    options: string[];
  }>;
}

export interface DummyJsonProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock: number;
  tags?: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  thumbnail: string;
  images?: string[];
}

/**
 * Maps internal Product to WooCommerce REST API product payload
 */
export function mapProductToWooCommerce(product: Product): WooCommerceApiProduct {
  let attributesPayload: Array<{
    name: string;
    visible: boolean;
    variation?: boolean;
    position?: number;
    options: string[];
  }> | undefined;

  if (Array.isArray(product.productAttributes) && product.productAttributes.length > 0) {
    attributesPayload = product.productAttributes.map((attr) => ({
      name: attr.rawName || attr.name,
      visible: attr.visible !== false,
      variation: attr.variation,
      position: attr.position,
      options: attr.options,
    }));
  } else {
    attributesPayload = Object.entries(product.attributes).map(([key, val]) => {
      const v = String(val);
      return {
        name: key.charAt(0).toUpperCase() + key.slice(1),
        visible: true,
        options: v.includes(',') ? v.split(',').map((s) => s.trim()).filter(Boolean) : [v],
      };
    });
  }

  const payload: WooCommerceApiProduct = {
    name: product.name,
    type: 'simple',
    regular_price: String(product.regularPrice),
    description: product.description,
    short_description: product.shortDescription || '',
    sku: product.sku,
    manage_stock: true,
    stock_quantity: product.stockQuantity,
    stock_status: product.stockStatus,
    status: product.status === 'published' ? 'publish' : 'draft',
    categories: [{ name: product.category }],
    images: product.imageUrl ? [{ src: product.imageUrl }] : [],
    attributes: attributesPayload,
  };

  if (product.salePrice && product.salePrice > 0) {
    payload.sale_price = String(product.salePrice);
  }

  if (attributesPayload.length > 0) {
    payload.attributes = attributesPayload;
  }

  return payload;
}

/**
 * Maps WooCommerce REST API product to internal Product
 */
function normalizeAttributeKey(rawName: string): string {
  return rawName
    .trim()
    .replace(/^pa[_-]/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function humanizeAttributeLabel(rawName: string): string {
  const stripped = rawName.replace(/^pa[_-]/i, '');
  return stripped
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mapWooCommerceToProduct(wcProduct: WooCommerceApiProduct): Product {
  const attributes: Record<string, string | number | boolean> = {};
  const productAttributes: Array<{
    key: string;
    name: string;
    rawName: string;
    options: string[];
    visible: boolean;
    variation: boolean;
    position?: number;
    source: 'woocommerce' | 'manual';
  }> = [];

  if (Array.isArray(wcProduct.attributes)) {
    for (const attr of wcProduct.attributes) {
      const rawName = attr.name || '';
      if (!rawName) continue;
      const key = normalizeAttributeKey(rawName);
      const label = humanizeAttributeLabel(rawName);
      const options = Array.isArray(attr.options) ? attr.options.filter(Boolean) : [];
      if (options.length === 0) continue;

      // Flat attributes: keep existing single-option behavior for backward compatibility
      attributes[key] = options.length > 1 ? options.join(', ') : options[0];

      productAttributes.push({
        key,
        name: label,
        rawName,
        options,
        visible: attr.visible !== false,
        variation: !!attr.variation,
        position: attr.position,
        source: 'woocommerce',
      });
    }
  }

  const categoryName = wcProduct.categories?.[0]?.name?.toLowerCase() || 'general';
  const regularPrice = parseFloat(wcProduct.regular_price || wcProduct.price || '0');
  const salePrice = wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : undefined;
  const imageUrl = wcProduct.images?.[0]?.src || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  const partialProduct: Partial<Product> = {
    name: wcProduct.name || 'Untitled WooCommerce Product',
    sku: wcProduct.sku || `WC-${wcProduct.id || Date.now()}`,
    description: wcProduct.description ? wcProduct.description.replace(/<[^>]+>/g, '').trim() : 'Imported from WooCommerce store.',
    shortDescription: wcProduct.short_description ? wcProduct.short_description.replace(/<[^>]+>/g, '').trim() : '',
    regularPrice,
    salePrice,
    stockQuantity: wcProduct.stock_quantity ?? 10,
    stockStatus: wcProduct.stock_status || 'instock',
    category: categoryName,
    imageUrl,
    attributes,
    status: wcProduct.status === 'publish' ? 'published' : 'draft',
  };

  const completeness = calculateProductCompleteness(partialProduct);

  const now = new Date().toISOString();
  return {
    id: `prod_${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36)}`,
    wooCommerceId: wcProduct.id,
    name: partialProduct.name!,
    sku: partialProduct.sku!,
    description: partialProduct.description!,
    shortDescription: partialProduct.shortDescription,
    regularPrice: partialProduct.regularPrice!,
    salePrice: partialProduct.salePrice,
    stockQuantity: partialProduct.stockQuantity!,
    stockStatus: partialProduct.stockStatus!,
    category: partialProduct.category!,
    imageUrl: partialProduct.imageUrl!,
    attributes: partialProduct.attributes!,
    productAttributes: productAttributes.length > 0 ? productAttributes : undefined,
    status: partialProduct.status!,
    completenessScore: completeness.score,
    missingFields: completeness.missingFields,
    syncStatus: 'synced',
    lastSyncTimestamp: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Maps DummyJSON item into internal Product format with category-specific attributes
 */
export function mapDummyJsonToProduct(item: DummyJsonProduct): Product {
  // Map DummyJSON category to our internal standard categories
  let category: ProductCategory = 'clothing';
  const cat = item.category.toLowerCase();
  if (cat.includes('smartphones') || cat.includes('laptops') || cat.includes('tablets') || cat.includes('mobile-accessories')) {
    category = 'electronics';
  } else if (cat.includes('furniture') || cat.includes('home-decoration') || cat.includes('kitchen-accessories')) {
    category = 'home-goods';
  } else if (cat.includes('beauty') || cat.includes('fragrances') || cat.includes('skin-care')) {
    category = 'beauty';
  } else if (cat.includes('shirts') || cat.includes('dresses') || cat.includes('shoes') || cat.includes('tops') || cat.includes('watches') || cat.includes('sunglasses')) {
    category = 'clothing';
  } else {
    category = 'home-goods';
  }

  // Populate realistic attributes based on category
  const attributes: Record<string, string | number | boolean> = {};
  if (item.brand) {
    attributes['brand'] = item.brand;
  }

  if (category === 'clothing') {
    attributes['brand'] = item.brand || 'Atelier Nordic';
    attributes['size'] = 'M';
    attributes['color'] = 'Navy Blue';
    attributes['material'] = '100% Organic Combed Cotton';
    attributes['gender'] = 'Unisex';
  } else if (category === 'electronics') {
    attributes['brand'] = item.brand || 'Vertex Tech';
    attributes['warranty'] = item.warrantyInformation || '1 Year Limited Warranty';
    attributes['connectivity'] = 'Bluetooth 5.3';
    attributes['batteryLife'] = '32';
    attributes['modelNumber'] = item.sku || `VTX-${item.id}00`;
  } else if (category === 'home-goods') {
    attributes['material'] = 'Solid Walnut & Powder-Coated Steel';
    attributes['dimensions'] = item.dimensions
      ? `${item.dimensions.width} x ${item.dimensions.height} x ${item.dimensions.depth} cm`
      : '45 x 30 x 15 cm';
    attributes['color'] = 'Natural Wood';
    attributes['careInstructions'] = 'Wipe clean with a damp cloth.';
  } else if (category === 'beauty') {
    attributes['brand'] = item.brand || 'Lumina Organics';
    attributes['volume'] = '50 ml';
    attributes['ingredients'] = 'Hyaluronic Acid, Vitamin C & Botanical Extracts';
    attributes['skinType'] = 'All Skin Types';
  }


  const regularPrice = item.price;
  const salePrice = item.discountPercentage && item.discountPercentage > 0
    ? Math.round((item.price * (1 - item.discountPercentage / 100)) * 100) / 100
    : undefined;

  const partialProduct: Partial<Product> = {
    name: item.title,
    sku: item.sku || `SKU-${item.id.toString().padStart(5, '0')}`,
    description: item.description,
    regularPrice,
    salePrice,
    stockQuantity: item.stock,
    stockStatus: item.stock > 0 ? 'instock' : 'outofstock',
    category,
    imageUrl: item.thumbnail || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    attributes,
    status: 'draft',
  };

  const completeness = calculateProductCompleteness(partialProduct);
  const now = new Date().toISOString();

  return {
    id: `prod_dj_${item.id}_${Date.now().toString(36)}`,
    name: item.title,
    sku: partialProduct.sku!,
    description: item.description,
    regularPrice,
    salePrice,
    stockQuantity: item.stock,
    stockStatus: partialProduct.stockStatus!,
    category,
    imageUrl: partialProduct.imageUrl!,
    attributes,
    status: completeness.canPublish ? 'published' : 'draft',
    completenessScore: completeness.score,
    missingFields: completeness.missingFields,
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}
