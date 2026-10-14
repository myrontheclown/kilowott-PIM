import { Product } from '@/types/product';
import { DummyJsonProduct, mapDummyJsonToProduct } from './product-mapper';

export async function fetchDummyJsonProducts(limit = 8): Promise<Product[]> {
  try {
    const res = await fetch(`https://dummyjson.com/products?limit=${limit}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`DummyJSON HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data.products && Array.isArray(data.products)) {
      return data.products.map((p: DummyJsonProduct) => mapDummyJsonToProduct(p));
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch from live DummyJSON, falling back to local demo catalog items:', err);
    // Reliable fallback items to never break during a hackathon demo
    const fallbackItems: DummyJsonProduct[] = [
      {
        id: 101,
        title: 'Minimalist Chronograph Wristwatch',
        description: 'Brushed 316L stainless steel case with sapphire crystal glass and genuine Italian calfskin leather strap.',
        category: 'mens-watches',
        price: 219,
        discountPercentage: 15,
        stock: 25,
        brand: 'Nordic Timepieces',
        sku: 'DJ-WCH-0101',
        thumbnail: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 102,
        title: 'Aura Studio Wireless Speaker',
        description: '360-degree acoustic immersion with integrated passive radiator subwoofer and ambient LED glow.',
        category: 'electronics',
        price: 179,
        discountPercentage: 10,
        stock: 30,
        brand: 'SoundArt',
        sku: 'DJ-SPK-0102',
        thumbnail: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 103,
        title: 'Organic Cold-Pressed Olive Body Oil',
        description: 'Deeply nourishing dry body oil formulated with extra virgin cold-pressed olive squalane and bergamot.',
        category: 'beauty',
        price: 38,
        discountPercentage: 0,
        stock: 45,
        brand: 'Terra Organics',
        sku: 'DJ-OIL-0103',
        thumbnail: 'https://images.unsplash.com/photo-1608248597359-2169eb9e7f8e?w=600&auto=format&fit=crop&q=80',
      },
    ];

    return fallbackItems.map((p) => mapDummyJsonToProduct(p));
  }
}
