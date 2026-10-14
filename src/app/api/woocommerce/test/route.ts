import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceClient } from '@/lib/woocommerce';
import { WooCommerceCredentialsSchema } from '@/lib/validation';

export async function GET() {
  try {
    const client = new WooCommerceClient();
    if (!client.hasCredentials()) {
      return NextResponse.json({
        connected: false,
        provider: 'woocommerce',
        message: 'WooCommerce credentials not configured in environment. Please configure WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in .env.local.',
        missingFields: [
          !process.env.WOOCOMMERCE_STORE_URL && 'WOOCOMMERCE_STORE_URL',
          !process.env.WOOCOMMERCE_CONSUMER_KEY && 'WOOCOMMERCE_CONSUMER_KEY',
          !process.env.WOOCOMMERCE_CONSUMER_SECRET && 'WOOCOMMERCE_CONSUMER_SECRET',
        ].filter(Boolean),
      }, { status: 400 });
    }

    const result = await client.testConnection();
    return NextResponse.json({
      connected: result.success,
      provider: 'woocommerce',
      message: result.message,
      storeUrl: client.getStoreUrl(),
      details: result.data,
      error: result.success ? undefined : result.message,
    }, { status: result.success ? 200 : 401 });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      provider: 'woocommerce',
      message: err.message || 'An unexpected error occurred while testing WooCommerce connection',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Check if body contains explicit override credentials or if env vars are present
    const storeUrl = body.storeUrl || process.env.WOOCOMMERCE_STORE_URL;
    const consumerKey = body.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = body.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json({
        connected: false,
        provider: 'woocommerce',
        message: 'WooCommerce credentials not configured. Please supply Store URL, Consumer Key, and Consumer Secret in .env.local.',
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
        storeUrl: client.getStoreUrl(),
        details: result.data,
      });
    } else {
      return NextResponse.json({
        connected: false,
        provider: 'woocommerce',
        message: result.message,
        storeUrl: client.getStoreUrl(),
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
