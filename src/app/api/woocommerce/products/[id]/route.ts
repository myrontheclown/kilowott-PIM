import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceClient } from '@/lib/woocommerce';
import { mapProductToWooCommerce } from '@/lib/product-mapper';
import { ProductSchema } from '@/lib/validation';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid WooCommerce product ID. Must be numeric.' }, { status: 400 });
    }

    const body = await req.json();
    const { product, credentials } = body;

    if (!product) {
      return NextResponse.json({ error: 'Missing product payload' }, { status: 400 });
    }

    // Validate product with Zod
    const validation = ProductSchema.safeParse(product);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed for product update',
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
    const updatedRemote = await client.updateProduct(numericId, wcPayload);

    return NextResponse.json({
      success: true,
      message: `Product #${numericId} successfully updated in WooCommerce`,
      wooCommerceId: updatedRemote.id,
      remoteProduct: updatedRemote,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to update product in WooCommerce',
      status: err.status || 500,
    }, { status: err.status || 500 });
  }
}
