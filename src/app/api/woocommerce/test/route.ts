import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceClient } from '@/lib/woocommerce';
import { WooCommerceCredentialsSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Check if body contains explicit credentials or if env vars are present
    const storeUrl = body.storeUrl || process.env.WOOCOMMERCE_STORE_URL;
    const consumerKey = body.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = body.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json({
        connected: false,
        provider: 'woocommerce',
        message: 'WooCommerce credentials not configured. Please supply Store URL, Consumer Key, and Consumer Secret.',
        missingFields: [
          !storeUrl && 'Store URL',
          !consumerKey && 'Consumer Key',
          !consumerSecret && 'Consumer Secret',
        ].filter(Boolean),
      }, { status: 400 });
    }

    // Validate credentials format
    const validation = WooCommerceCredentialsSchema.safeParse({ storeUrl, consumerKey, consumerSecret });
    if (!validation.success) {
      return NextResponse.json({
        connected: false,
        provider: 'woocommerce',
        message: validation.error.issues[0]?.message || 'Invalid credentials format',
      }, { status: 400 });
    }

    const client = new WooCommerceClient({ storeUrl, consumerKey, consumerSecret });
    const result = await client.testConnection();

    if (result.success) {
      return NextResponse.json({
        connected: true,
        provider: 'woocommerce',
        message: result.message,
        storeUrl,
        details: result.data,
      });
    } else {
      return NextResponse.json({
        connected: false,
        provider: 'woocommerce',
        message: result.message,
        error: result.message,
      }, { status: 401 });
    }
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      provider: 'woocommerce',
      message: err.message || 'An unexpected error occurred while testing WooCommerce connection',
    }, { status: 500 });
  }
}
