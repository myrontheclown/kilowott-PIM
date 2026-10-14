import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceClient } from '@/lib/woocommerce';
import { mapProductToWooCommerce, mapWooCommerceToProduct } from '@/lib/product-mapper';
import { ProductSchema } from '@/lib/validation';
import { calculateProductCompleteness } from '@/lib/completeness';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeUrl = searchParams.get('storeUrl') || undefined;
    const consumerKey = searchParams.get('consumerKey') || undefined;
    const consumerSecret = searchParams.get('consumerSecret') || undefined;
    const fetchAll = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '50', 10);

    const client = new WooCommerceClient({ storeUrl, consumerKey, consumerSecret });

    if (!client.hasCredentials()) {
      return NextResponse.json({
        success: false,
        error: 'WooCommerce credentials not configured. Please configure WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in .env.local.',
      }, { status: 400 });
    }

    if (fetchAll) {
      const { products: rawProducts, totalCount, pagesFetched } = await client.getAllProducts(perPage, 10);
      const mappedProducts = rawProducts.map(mapWooCommerceToProduct);

      return NextResponse.json({
        success: true,
        count: mappedProducts.length,
        total: totalCount,
        pagesFetched,
        products: mappedProducts,
      });
    } else {
      const { products: rawProducts, totalPages, total } = await client.getProducts(perPage, page);
      const mappedProducts = rawProducts.map(mapWooCommerceToProduct);

      return NextResponse.json({
        success: true,
        count: mappedProducts.length,
        totalPages,
        total,
        page,
        products: mappedProducts,
      });
    }
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

    // Validate product structure using Zod
    const validation = ProductSchema.safeParse(product);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed for product payload',
        issues: validation.error.issues,
      }, { status: 422 });
    }

    // Completeness validation rule: prevent publishing if incomplete!
    if (product.status === 'published') {
      const completeness = calculateProductCompleteness(product);
      if (!completeness.canPublish) {
        return NextResponse.json({
          error: `Cannot publish product to WooCommerce: ${completeness.publishBlockers[0] || 'Required attributes missing'}. Set status to 'draft' or complete all required category fields.`,
          publishBlockers: completeness.publishBlockers,
        }, { status: 422 });
      }
    }

    const client = new WooCommerceClient(credentials);
    if (!client.hasCredentials()) {
      return NextResponse.json({
        error: 'WooCommerce credentials not configured. Please configure credentials in .env.local.',
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
