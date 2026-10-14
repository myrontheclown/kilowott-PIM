import { URL } from 'node:url';

async function diagnose() {
  console.log('=== Step 1: Inspecting Environment Configuration ===');
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  console.log(`- STORE_URL present: ${Boolean(storeUrl)}`);
  if (storeUrl) {
    console.log(`  Raw value length: ${storeUrl.length}`);
    console.log(`  Has leading/trailing whitespace: ${storeUrl !== storeUrl.trim()}`);
    console.log(`  Has surrounding quotes: ${/^["'].*["']$/.test(storeUrl)}`);
    try {
      const u = new URL(storeUrl);
      console.log(`  Protocol: ${u.protocol}`);
      console.log(`  Host: ${u.host}`);
      console.log(`  Pathname: ${u.pathname}`);
    } catch (e: any) {
      console.log(`  URL parse error: ${e.message}`);
    }
  }

  console.log(`- CONSUMER_KEY present: ${Boolean(consumerKey)}`);
  if (consumerKey) {
    console.log(`  Length: ${consumerKey.length}`);
    console.log(`  Has leading/trailing whitespace: ${consumerKey !== consumerKey.trim()}`);
    console.log(`  Has surrounding quotes: ${/^["'].*["']$/.test(consumerKey)}`);
    console.log(`  Starts with 'ck_': ${consumerKey.trim().startsWith('ck_')}`);
    console.log(`  Plausible format (ck_[40 hex]): ${/^ck_[a-f0-9]{40}$/i.test(consumerKey.trim())}`);
  }

  console.log(`- CONSUMER_SECRET present: ${Boolean(consumerSecret)}`);
  if (consumerSecret) {
    console.log(`  Length: ${consumerSecret.length}`);
    console.log(`  Has leading/trailing whitespace: ${consumerSecret !== consumerSecret.trim()}`);
    console.log(`  Has surrounding quotes: ${/^["'].*["']$/.test(consumerSecret)}`);
    console.log(`  Starts with 'cs_': ${consumerSecret.trim().startsWith('cs_')}`);
    console.log(`  Plausible format (cs_[40 hex]): ${/^cs_[a-f0-9]{40}$/i.test(consumerSecret.trim())}`);
  }

  if (!storeUrl || !consumerKey || !consumerSecret) {
    console.log('❌ Incomplete configuration. Aborting network tests.');
    return;
  }

  const cleanStoreUrl = storeUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  const cleanKey = consumerKey.trim().replace(/^["']|["']$/g, '');
  const cleanSecret = consumerSecret.trim().replace(/^["']|["']$/g, '');

  console.log('\n=== Step 2: Testing Store Reachability and HTTPS availability ===');

  // Check HTTP
  try {
    const resHttp = await fetch(`${cleanStoreUrl}/wp-json/`, {
      method: 'GET',
      headers: { 'User-Agent': 'CatalogSync-Diagnostics' },
    });
    console.log(`- HTTP /wp-json/ status: ${resHttp.status}`);
    const dataHttp = await resHttp.json().catch(() => null);
    console.log(`  Site name: "${dataHttp?.name || '(unknown)'}"`);
    console.log(`  Namespaces: ${dataHttp?.namespaces?.join(', ') || 'none'}`);
    console.log(`  Has wc/v3 namespace: ${dataHttp?.namespaces?.includes('wc/v3')}`);
    console.log(`  Authentication types reported in index: ${JSON.stringify(dataHttp?.authentication || {})}`);
  } catch (e: any) {
    console.log(`- HTTP check failed: ${e.message}`);
  }

  // Check if HTTPS is available for the same host
  let httpsUrl: string | null = null;
  if (cleanStoreUrl.startsWith('http://')) {
    httpsUrl = cleanStoreUrl.replace('http://', 'https://');
    console.log(`\n- Testing if HTTPS equivalent (${httpsUrl}) is available in LocalWP...`);
    try {
      const resHttps = await fetch(`${httpsUrl}/wp-json/`, {
        method: 'GET',
        headers: { 'User-Agent': 'CatalogSync-Diagnostics' },
      });
      console.log(`  HTTPS /wp-json/ status: ${resHttps.status}`);
    } catch (e: any) {
      console.log(`  HTTPS check failed: ${e.message} (code: ${e.code || e.cause?.code})`);
    }
  }

  console.log('\n=== Step 3: Inspecting Authentication Mechanisms ===');

  // Test A: Basic Auth Header on cleanStoreUrl
  const basicAuthToken = Buffer.from(`${cleanKey}:${cleanSecret}`).toString('base64');
  console.log('Test A: Basic Auth Header (Authorization: Basic ...)');
  try {
    const resA = await fetch(`${cleanStoreUrl}/wp-json/wc/v3/products?per_page=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuthToken}`,
        'Accept': 'application/json',
      },
    });
    console.log(`- Status: ${resA.status}`);
    const bodyA = await resA.json().catch(() => null);
    console.log(`- Response: code=${bodyA?.code}, message="${bodyA?.message}", isArray=${Array.isArray(bodyA)}`);
  } catch (e: any) {
    console.log(`- Test A error: ${e.message}`);
  }

  // Test B: Basic Auth on HTTPS (if available)
  if (httpsUrl) {
    console.log('\nTest B: Basic Auth Header on HTTPS URL');
    try {
      const resB = await fetch(`${httpsUrl}/wp-json/wc/v3/products?per_page=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuthToken}`,
          'Accept': 'application/json',
        },
      });
      console.log(`- Status: ${resB.status}`);
      const bodyB = await resB.json().catch(() => null);
      console.log(`- Response: code=${bodyB?.code}, message="${bodyB?.message}", isArray=${Array.isArray(bodyB)}`);
      if (Array.isArray(bodyB)) {
        console.log(`  🎉 Found ${bodyB.length} products on HTTPS!`);
      }
    } catch (e: any) {
      console.log(`- Test B error: ${e.message}`);
    }
  }

  // Test C: Query string parameters on HTTP
  console.log('\nTest C: Query string authentication (consumer_key & consumer_secret in URL)');
  try {
    const queryUrl = new URL(`${cleanStoreUrl}/wp-json/wc/v3/products`);
    queryUrl.searchParams.set('per_page', '1');
    queryUrl.searchParams.set('consumer_key', cleanKey);
    queryUrl.searchParams.set('consumer_secret', cleanSecret);

    const resC = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log(`- Status: ${resC.status}`);
    const bodyC = await resC.json().catch(() => null);
    console.log(`- Response: code=${bodyC?.code}, message="${bodyC?.message}", isArray=${Array.isArray(bodyC)}`);
    if (Array.isArray(bodyC)) {
      console.log(`  🎉 Found ${bodyC.length} products on HTTP with query auth!`);
    }
  } catch (e: any) {
    console.log(`- Test C error: ${e.message}`);
  }

  // Test D: Check who is the authenticated user or what user capabilities exist
  console.log('\nTest D: Testing /wp-json/wp/v2/users/me with Basic Auth');
  try {
    const resD = await fetch(`${cleanStoreUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuthToken}`,
        'Accept': 'application/json',
      },
    });
    console.log(`- /wp/v2/users/me Status: ${resD.status}`);
    const bodyD = await resD.json().catch(() => null);
    console.log(`- User response: id=${bodyD?.id}, name=${bodyD?.name}, roles=${JSON.stringify(bodyD?.roles)}, code=${bodyD?.code}, message=${bodyD?.message}`);
  } catch (e: any) {
    console.log(`- Test D error: ${e.message}`);
  }
}

diagnose();
