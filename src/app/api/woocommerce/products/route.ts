import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceClient } from '@/lib/woocommerce';
import { mapProductToWooCommerce, mapWooCommerceToProduct } from '@/lib/product-mapper';
import { ProductSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeUrl = searchParams.get('storeUrl') || process.env.WOOCOMMERCE_STORE_URL;
    const consumerKey = searchParams.get('consumerKey') || process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = searchParams.get('consumerSecret') || process.env.WOOCOMMERCE_CONSUMER_SECRET;

    const client = new WooCommerceClient({ storeUrl: storeUrl || undefined, consumerKey: consumerKey || undefined, consumerSecret: consumerSecret || undefined });

    if (!client.hasCredentials()) {
      return NextResponse.json({
        error: 'WooCommerce credentials missing. Please configure credentials in Settings.',
      }, { status: 400 });
    }

    const wcProducts = await client.getProducts(30);
    const mappedProducts = wcProducts.map(mapWooCommerceToProduct);

    return NextResponse.json({
      success: true,
      count: mappedProducts.length,
      products: mappedProducts,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch WooCommerce products',
      status: err.status || 500,
    }, { status: err.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, credentials } = body;

    if (!product) {
      return NextResponse.json({ error: 'Missing product payload' }, { status: 400 });
    }

    // Validate product using Zod
    const validation = ProductSchema.safeParse(product);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed for product',
        issues: validation.error.issues,
      }, { status: 422 });
    }

    const client = new WooCommerceClient(credentials);
    if (!client.hasCredentials()) {
      return NextResponse.json({
        error: 'WooCommerce credentials not configured. Please supply Store URL, Consumer Key, and Consumer Secret.',
      }, { status: 400 });
    }

    const wcPayload = mapProductToWooCommerce(product);
    const remoteProduct = await client.createProduct(wcPayload);

    return NextResponse.json({
      success: true,
      message: `Product successfully created in WooCommerce with ID #${remoteProduct.id}`,
      wooCommerceId: remoteProduct.id,
      remoteProduct,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to create product in WooCommerce',
      status: err.status || 500,
    }, { status: err.status || 500 });
  }
}
