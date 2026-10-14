import { CategoryRule, Product, ProductAttribute } from '@/types/product';

export const ATTRIBUTE_METADATA_KEYS = ['productAttributes'] as const;

export function normalizeAttributeKey(rawName: string): string {
  return rawName
    .trim()
    .replace(/^pa[_-]/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function humanizeAttributeLabel(rawName: string): string {
  const stripped = rawName.replace(/^pa[_-]/i, '');
  return stripped
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractProductAttributes(product: Product): ProductAttribute[] {
  if (Array.isArray(product.productAttributes) && product.productAttributes.length > 0) {
    return product.productAttributes.map((attr) => ({
      key: attr.key,
      name: attr.name,
      rawName: attr.rawName,
      options: Array.isArray(attr.options) ? attr.options.slice() : [],
      visible: attr.visible !== false,
      variation: !!attr.variation,
      position: attr.position,
      source: attr.source,
    }));
  }

  const attrs: ProductAttribute[] = [];
  const entries = Object.entries(product.attributes);
  for (const [key, val] of entries) {
    if (val === undefined || val === null) continue;
    const s = String(val).trim();
    if (s === '') continue;
    const options = s.includes(',') ? s.split(',').map((v) => v.trim()).filter(Boolean) : [s];
    attrs.push({
      key,
      name: humanizeAttributeLabel(key),
      rawName: key,
      options,
      visible: true,
      variation: false,
      source: product.wooCommerceId ? 'woocommerce' : 'manual',
    });
  }
  return attrs;
}

export interface AttributeSummary {
  key: string;
  label: string;
  rawName: string;
  productCount: number;
  exampleValues: string[];
  categories: string[];
  sources: Array<'woocommerce' | 'manual'>;
  requiredInCategories: string[];
  isRequiredInAnyRule: boolean;
}

export function buildAttributeSummary(products: Product[], rules: CategoryRule[]): AttributeSummary[] {
  const map = new Map<string, {
    label: string;
    rawName: string;
    productCount: Set<string>;
    exampleValues: Set<string>;
    categories: Set<string>;
    sources: Set<'woocommerce' | 'manual'>;
    requiredInCategories: Set<string>;
  }>();

  const requiredKeyToCategories = new Map<string, Set<string>>();
  for (const rule of rules) {
    for (const attrDef of rule.attributes) {
      const key = normalizeAttributeKey(attrDef.key);
      if (!requiredKeyToCategories.has(key)) {
        requiredKeyToCategories.set(key, new Set<string>());
      }
      requiredKeyToCategories.get(key)!.add(rule.category);
    }
  }

  for (const p of products) {
    const attrs = extractProductAttributes(p);
    const seenKeys = new Set<string>();
    for (const a of attrs) {
      const key = a.key;
      if (!map.has(key)) {
        map.set(key, {
          label: a.name,
          rawName: a.rawName,
          productCount: new Set<string>(),
          exampleValues: new Set<string>(),
          categories: new Set<string>(),
          sources: new Set<'woocommerce' | 'manual'>(),
          requiredInCategories: new Set<string>(),
        });
      }
      const rec = map.get(key)!;
      if (rec.label === key || rec.label === humanizeAttributeLabel(key)) {
        if (a.name && a.name.length > rec.label.length) {
          rec.label = a.name;
        }
      }
      if (!rec.rawName || rec.rawName === key) {
        rec.rawName = a.rawName || rec.rawName;
      }
      rec.productCount.add(p.id);
      rec.categories.add(p.category);
      rec.sources.add(a.source);
      for (const opt of a.options) {
        rec.exampleValues.add(opt);
      }
      seenKeys.add(key);
    }
  }

  const summaries: AttributeSummary[] = [];
  for (const [key, rec] of map.entries()) {
    const requiredCats = requiredKeyToCategories.get(key);
    if (requiredCats) {
      for (const c of requiredCats) rec.requiredInCategories.add(c);
    }
    summaries.push({
      key,
      label: rec.label || humanizeAttributeLabel(key),
      rawName: rec.rawName || key,
      productCount: rec.productCount.size,
      exampleValues: Array.from(rec.exampleValues).slice(0, 6),
      categories: Array.from(rec.categories).sort(),
      sources: Array.from(rec.sources).sort(),
      requiredInCategories: Array.from(rec.requiredInCategories).sort(),
      isRequiredInAnyRule: rec.requiredInCategories.size > 0,
    });
  }
  return summaries.sort((a, b) => b.productCount - a.productCount || a.key.localeCompare(b.key));
}

export interface AttributeOverview {
  distinctAttributeNames: number;
  productsWithAttributes: number;
  requiredAttributeCount: number; // distinct required keys across rules
  productsMissingRequired: number;
}

export function computeAttributeOverview(products: Product[], rules: CategoryRule[]): AttributeOverview {
  const summaries = buildAttributeSummary(products, rules);
  const distinctAttributeNames = summaries.length;
  const productsWithAttributes = new Set<string>();
  for (const p of products) {
    const attrs = extractProductAttributes(p);
    if (attrs.length > 0) productsWithAttributes.add(p.id);
  }

  const requiredKeys = new Set<string>();
  for (const rule of rules) {
    for (const a of rule.attributes) {
      if (a.required) requiredKeys.add(normalizeAttributeKey(a.key));
    }
  }
  const requiredAttributeCount = requiredKeys.size;

  const productsMissingRequired = new Set<string>();
  for (const p of products) {
    const rule = rules.find((r) => r.category.toLowerCase() === p.category.toLowerCase());
    if (!rule) continue;
    const required = rule.attributes.filter((a) => a.required);
    if (required.length === 0) continue;
    const pAttrs = extractProductAttributes(p);
    const pKeys = new Set(pAttrs.map((a) => a.key));
    for (const ra of required) {
      const rk = normalizeAttributeKey(ra.key);
      if (!pKeys.has(rk)) {
        productsMissingRequired.add(p.id);
        break;
      }
    }
  }

  return {
    distinctAttributeNames,
    productsWithAttributes: productsWithAttributes.size,
    requiredAttributeCount,
    productsMissingRequired: productsMissingRequired.size,
  };
}

export function getProductsUsingAttribute(products: Product[], key: string): Product[] {
  return products.filter((p) => {
    const attrs = extractProductAttributes(p);
    return attrs.some((a) => a.key === key);
  });
}

export function getAttributeValueForProduct(product: Product, key: string): string | undefined {
  const attrs = extractProductAttributes(product);
  const found = attrs.find((a) => a.key === key);
  if (!found) return undefined;
  return found.options.join(', ');
}

export interface DashboardMetrics {
  total: number;
  published: number;
  draft: number;
  incomplete: number;
  synced: number;
  pending: number;
  failed: number;
  categoriesCount: number;
  productsByCategory: Array<{ category: string; count: number; avgCompleteness: number }>;
  completenessDistribution: Array<{ range: string; count: number; pct: number }>;
  syncOutcomes: Array<{ label: string; count: number }>;
  attributeCompletenessByCategory: Array<{ category: string; avgAttributeCompleteness: number; totalProducts: number; missingReq: number }>;
  lastSuccessfulImport?: string | null;
  failedSyncItems: Array<{ id: string; name: string; sku: string; error?: string; timestamp?: string }>;
  productsRequiringAttention: Product[];
}

export function computeDashboardMetrics(products: Product[], rules: CategoryRule[], syncLogs?: Array<{timestamp?: string; status?: string; action?: string}>): DashboardMetrics {
  const total = products.length;
  const published = products.filter((p) => p.status === 'published').length;
  const draft = total - published;
  const incomplete = products.filter((p) => p.completenessScore < 100).length;

  const synced = products.filter((p) => p.syncStatus === 'synced').length;
  const pending = products.filter((p) => p.syncStatus === 'pending').length;
  const failed = products.filter((p) => p.syncStatus === 'failed').length;

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const categoriesCount = categories.length;

  const productsByCategory = categories.map((cat) => {
    const prods = products.filter((p) => p.category === cat);
    const avg = prods.length === 0 ? 0 : Math.round(prods.reduce((a, b) => a + b.completenessScore, 0) / prods.length);
    return { category: cat, count: prods.length, avgCompleteness: avg };
  });

  const ranges = [
    { min: 0, max: 39, range: '0–39%' },
    { min: 40, max: 69, range: '40–69%' },
    { min: 70, max: 99, range: '70–99%' },
    { min: 100, max: 100, range: '100%' },
  ];
  const dist = ranges.map((r) => {
    const count = products.filter((p) => p.completenessScore >= r.min && p.completenessScore <= r.max).length;
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return { range: r.range, count, pct };
  });
  const completenessDistribution = dist;

  const syncOutcomes = [
    { label: 'Success/Synced', count: synced },
    { label: 'Pending', count: pending },
    { label: 'Failed', count: failed },
  ];

  const attributeCompletenessByCategory = categories.map((cat) => {
    const prods = products.filter((p) => p.category === cat);
    const rule = rules.find((r) => r.category.toLowerCase() === cat.toLowerCase());
    const required = rule ? rule.attributes.filter((a) => a.required) : [];
    let totalReqChecks = 0;
    let metReq = 0;
    for (const prod of prods) {
      if (required.length === 0) {
        totalReqChecks += 1;
        metReq += 1;
        continue;
      }
      for (const ra of required) {
        totalReqChecks += 1;
        const rk = normalizeAttributeKey(ra.key);
        const pAttrs = extractProductAttributes(prod);
        const pKeys = new Set(pAttrs.map((a) => a.key));
        if (pKeys.has(rk)) metReq += 1;
      }
    }
    const avgAttr = totalReqChecks === 0 ? 0 : Math.round((metReq / totalReqChecks) * 100);
    const missingReq = prods.filter((p) => {
      if (!rule || required.length === 0) return false;
      const pAttrs = extractProductAttributes(p);
      const pKeys = new Set(pAttrs.map((a) => a.key));
      for (const ra of required) {
        if (!pKeys.has(normalizeAttributeKey(ra.key))) return true;
      }
      return false;
    }).length;
    return { category: cat, avgAttributeCompleteness: avgAttr, totalProducts: prods.length, missingReq };
  });

  let lastSuccessfulImport: string | null = null;
  if (syncLogs) {
    const sorted = [...syncLogs].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    const found = sorted.find((l) => l.action === 'import' && (l.status === 'success' || l.status === 'simulated'));
    if (found && found.timestamp) lastSuccessfulImport = found.timestamp;
  } else {
    const sorted = [...products.filter((p) => p.lastSyncTimestamp)].sort((a, b) => new Date(b.lastSyncTimestamp!).getTime() - new Date(a.lastSyncTimestamp!).getTime());
    if (sorted[0]?.lastSyncTimestamp) lastSuccessfulImport = sorted[0].lastSyncTimestamp!;
  }

  const failedSyncItems = products.filter((p) => p.syncStatus === 'failed').slice(0, 10).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    error: p.lastSyncError,
    timestamp: p.lastSyncTimestamp,
  }));

  const productsRequiringAttention = products.filter((p) => p.completenessScore < 100 || p.syncStatus === 'failed').slice(0, 12);

  return {
    total,
    published,
    draft,
    incomplete,
    synced,
    pending,
    failed,
    categoriesCount,
    productsByCategory,
    completenessDistribution,
    syncOutcomes,
    attributeCompletenessByCategory,
    lastSuccessfulImport,
    failedSyncItems,
    productsRequiringAttention,
  };
}
