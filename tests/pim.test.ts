import assert from 'node:assert/strict';
import { calculateProductCompleteness } from '../src/lib/completeness';
import { DEFAULT_CATEGORY_RULES } from '../src/lib/default-rules';
import { mapProductToWooCommerce, mapWooCommerceToProduct, mapDummyJsonToProduct } from '../src/lib/product-mapper';
import { ProductSchema, WooCommerceCredentialsSchema } from '../src/lib/validation';
import { DemoProvider } from '../src/lib/providers/demo-provider';
import { WooCommerceClient } from '../src/lib/woocommerce';
import { Product } from '../src/types/product';

async function runTests() {
  console.log('🧪 Starting CatalogSync PIM Test Suite...\n');

  // Test 1: Completeness - 100% Complete Product
  console.log('Test 1: Completeness calculation for complete product');
  const completeProduct: Partial<Product> = {
    name: 'Merino Wool Crewneck Sweater',
    sku: 'APP-MRN-001',
    regularPrice: 129.00,
    category: 'clothing',
    description: '100% extrafine merino wool luxury sweater with ribbed collar.',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633',
    stockQuantity: 42,
    attributes: {
      brand: 'Nordic Atelier',
      size: 'L',
      color: 'Charcoal Heather',
      material: '100% Merino Wool',
    },
  };
  const result1 = calculateProductCompleteness(completeProduct, DEFAULT_CATEGORY_RULES);
  assert.equal(result1.score, 100, `Expected score 100, got ${result1.score}`);
  assert.equal(result1.isComplete, true);
  assert.equal(result1.canPublish, true);
  assert.equal(result1.missingFields.length, 0);
  console.log('  ✓ 100% complete product correctly evaluated and publish-approved');

  // Test 2: Completeness - Incomplete Product (Missing Category Required Attributes)
  console.log('Test 2: Completeness calculation for product missing required attributes');
  const incompleteProduct: Partial<Product> = {
    name: 'Raw Denim Jacket',
    sku: 'APP-DNM-002',
    regularPrice: 185.00,
    category: 'clothing',
    description: 'Heavyweight 14oz Japanese selvedge denim jacket.',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
    stockQuantity: 18,
    attributes: {
      brand: 'Kuroki Mills',
      size: 'XL',
      // Missing required clothing fields: 'color' and 'material'!
    },
  };
  const result2 = calculateProductCompleteness(incompleteProduct, DEFAULT_CATEGORY_RULES);
  assert.ok(result2.score < 100, `Expected score < 100, got ${result2.score}`);
  assert.equal(result2.canPublish, false, 'Incomplete product must NOT be eligible for publishing');
  assert.ok(result2.missingFields.some(f => f.includes('Color')), 'Must identify missing Color');
  assert.ok(result2.missingFields.some(f => f.includes('Material')), 'Must identify missing Material');
  console.log('  ✓ Incomplete product correctly denied publishing and missing fields listed:', result2.missingFields);

  // Test 3: Product to WooCommerce Payload Mapper
  console.log('Test 3: Internal Product to WooCommerce REST API payload mapping');
  const fullProd: Product = {
    id: 'prod-001',
    wooCommerceId: 1042,
    name: 'AcousticPro ANC Headphones',
    sku: 'ELC-ANC-099',
    description: 'Studio-grade hybrid active noise cancellation with 40mm drivers.',
    regularPrice: 249.99,
    salePrice: 199.99,
    stockQuantity: 65,
    stockStatus: 'instock',
    category: 'electronics',
    imageUrl: 'https://example.com/headphones.jpg',
    attributes: {
      brand: 'SoundForm',
      warranty: '2 Years Manufacturer',
      connectivity: 'Bluetooth 5.3',
    },
    status: 'published',
    completenessScore: 100,
    missingFields: [],
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const wcPayload = mapProductToWooCommerce(fullProd);
  assert.equal(wcPayload.name, 'AcousticPro ANC Headphones');
  assert.equal(wcPayload.sku, 'ELC-ANC-099');
  assert.equal(wcPayload.regular_price, '249.99');
  assert.equal(wcPayload.sale_price, '199.99');
  assert.equal(wcPayload.status, 'publish');
  assert.equal(wcPayload.categories?.[0]?.name, 'electronics');
  assert.ok(wcPayload.attributes && wcPayload.attributes.length >= 3);
  console.log('  ✓ Successfully mapped internal product to WooCommerce v3 REST format with attributes');

  // Test 4: WooCommerce Product to Internal Product Mapper
  console.log('Test 4: WooCommerce REST response to Internal Product mapping');
  const wcApiResponse = {
    id: 5521,
    name: 'Minimalist Walnut Desk Shelf',
    sku: 'HOM-SHF-552',
    regular_price: '89.00',
    description: '<p>Handcrafted solid walnut monitor riser.</p>',
    stock_quantity: 15,
    stock_status: 'instock' as const,
    status: 'publish' as const,
    categories: [{ name: 'Home Goods' }],
    images: [{ src: 'https://example.com/shelf.jpg' }],
    attributes: [
      { name: 'Material', options: ['Solid Walnut'] },
      { name: 'Dimensions', options: ['105 x 23 x 11 cm'] },
    ],
  };
  const internalProd = mapWooCommerceToProduct(wcApiResponse);
  assert.equal(internalProd.wooCommerceId, 5521);
  assert.equal(internalProd.name, 'Minimalist Walnut Desk Shelf');
  assert.equal(internalProd.regularPrice, 89.00);
  assert.equal(internalProd.syncStatus, 'synced');
  assert.equal(internalProd.attributes['material'], 'Solid Walnut');
  assert.equal(internalProd.attributes['dimensions'], '105 x 23 x 11 cm');
  console.log('  ✓ Successfully mapped WooCommerce REST API response into internal product model');

  // Test 5: DummyJSON Item to Internal Product Mapper
  console.log('Test 5: DummyJSON product mapping with automatic attribute synthesis');
  const dummyItem = {
    id: 88,
    title: 'Precision Mechanical Stopwatch',
    description: 'Classic sports chronograph with mechanical flywheel movement.',
    category: 'mens-watches',
    price: 145,
    discountPercentage: 10,
    stock: 22,
    brand: 'TimeMaster',
    sku: 'DJ-WCH-0088',
    thumbnail: 'https://example.com/watch.jpg',
  };
  const mappedDj = mapDummyJsonToProduct(dummyItem);
  assert.equal(mappedDj.name, 'Precision Mechanical Stopwatch');
  assert.equal(mappedDj.regularPrice, 145);
  assert.ok(mappedDj.salePrice !== undefined);
  assert.equal(mappedDj.syncStatus, 'pending');
  assert.ok(mappedDj.attributes['brand'] !== undefined);
  console.log('  ✓ Successfully mapped DummyJSON product item to CatalogSync schema');

  // Test 6: Zod Schema Validation
  console.log('Test 6: Zod schema strict validation');
  const validResult = ProductSchema.safeParse({
    name: 'Artisan Coffee Grinder',
    sku: 'HOM-GRD-01',
    description: 'Precision conical burr grinder with 40 grind settings.',
    regularPrice: 85,
    stockQuantity: 20,
    stockStatus: 'instock',
    category: 'home-goods',
    imageUrl: 'https://example.com/grinder.jpg',
    attributes: { burr: 'Stainless Steel' },
    status: 'draft',
  });
  assert.equal(validResult.success, true);

  const invalidResult = ProductSchema.safeParse({
    name: 'AB', // too short (< 3)
    sku: 'A', // too short (< 2)
    description: 'Short',
    regularPrice: -10, // negative price!
    stockQuantity: -5,
    stockStatus: 'instock',
    category: '',
    imageUrl: 'not-a-url',
    attributes: {},
    status: 'draft',
  });
  assert.equal(invalidResult.success, false);
  console.log('  ✓ Zod validation successfully catches invalid product input and negative prices');

  // Test 7: Demo Provider Simulation Labeling
  console.log('Test 7: Demo provider labeling & simulation guarantee');
  const demoProvider = new DemoProvider();
  const demoResult = await demoProvider.syncProduct(fullProd);
  assert.equal(demoResult.simulated, true, 'Demo sync must be labeled simulated');
  assert.equal(demoResult.syncStatus, 'simulated');
  assert.ok(demoResult.message.includes('Simulated sync'));
  console.log('  ✓ Demo provider correctly returns simulated status and explicit labeling');

  // Test 8: WooCommerce Client Credential Check
  console.log('Test 8: WooCommerce client credential security check');
  const unconfiguredClient = new WooCommerceClient({ storeUrl: '', consumerKey: '', consumerSecret: '' });
  assert.equal(unconfiguredClient.hasCredentials(), false);
  const testConn = await unconfiguredClient.testConnection();
  assert.equal(testConn.success, false);
  assert.ok(testConn.message.includes('credentials are missing'));
  console.log('  ✓ WooCommerce client safely enforces server-side credential requirements');

  console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
