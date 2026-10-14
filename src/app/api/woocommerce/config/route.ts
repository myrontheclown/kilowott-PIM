import { NextResponse } from 'next/server';
import { WooCommerceClient } from '@/lib/woocommerce';

export async function GET() {
  try {
    const client = new WooCommerceClient();
    const masked = client.getMaskedCredentials();
    const isConfigured = client.hasCredentials();
    const isDemoModeDefault = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

    return NextResponse.json({
      isConfigured,
      storeUrl: masked.storeUrl,
      hasConsumerKey: masked.hasKey,
      hasConsumerSecret: masked.hasSecret,
      maskedKey: masked.maskedKey,
      isDemoModeDefault,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to read server configuration' },
      { status: 500 }
    );
  }
}
