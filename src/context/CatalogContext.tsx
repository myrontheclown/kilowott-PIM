'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  CategoryRule,
  Product,
  ProductCreate,
  ProductUpdate,
  ProviderMode,
  SyncLog,
  WooCommerceCredentials,
} from '@/types/product';
import { DEFAULT_CATEGORY_RULES } from '@/lib/default-rules';
import { INITIAL_PRODUCTS, INITIAL_SYNC_LOGS } from '@/lib/initial-data';
import { calculateProductCompleteness } from '@/lib/completeness';
import { demoProvider } from '@/lib/providers/demo-provider';
import { WooCommerceProvider, wooCommerceProvider } from '@/lib/providers/woocommerce-provider';
import { ICatalogProvider } from '@/lib/providers/types';
import { fetchDummyJsonProducts } from '@/lib/dummyjson';

export interface ImportStats {
  imported: number;
  updated: number;
  skipped: number;
  total: number;
}

export interface ServerConfig {
  isConfigured: boolean;
  storeUrl?: string;
  hasConsumerKey: boolean;
  hasConsumerSecret: boolean;
  maskedKey?: string;
  isDemoModeDefault: boolean;
}

interface CatalogContextType {
  products: Product[];
  syncLogs: SyncLog[];
  categoryRules: CategoryRule[];
  providerMode: ProviderMode;
  serverConfig: ServerConfig | null;
  activeProvider: ICatalogProvider;
  isSyncing: boolean;
  setProviderMode: (mode: ProviderMode) => void;
  refreshServerConfig: () => Promise<ServerConfig | null>;
  addProduct: (data: ProductCreate) => Product;
  updateProduct: (id: string, updates: ProductUpdate) => Product;
  deleteProduct: (id: string) => boolean;
  syncSingleProduct: (id: string) => Promise<{ success: boolean; message: string }>;
  syncAllPending: () => Promise<{ total: number; succeeded: number; failed: number }>;
  importDummyJson: () => Promise<ImportStats>;
  importFromCurrentProvider: () => Promise<ImportStats>;
  updateCategoryRules: (rules: CategoryRule[]) => void;
  resetToDemoSeed: () => void;
}

const CatalogContext = createContext<CatalogContextType | null>(null);

const STORAGE_KEYS = {
  PRODUCTS: 'catalog_sync_products_v2',
  LOGS: 'catalog_sync_logs_v2',
  RULES: 'catalog_sync_rules_v2',
  MODE: 'catalog_sync_mode_v2',
};

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(INITIAL_SYNC_LOGS);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>(DEFAULT_CATEGORY_RULES);
  const [providerMode, setProviderModeState] = useState<ProviderMode>('demo');
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fetch server configuration status (safe: never contains secrets)
  const refreshServerConfig = useCallback(async (): Promise<ServerConfig | null> => {
    try {
      const res = await fetch('/api/woocommerce/config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setServerConfig(data);
        return data;
      }
    } catch (e) {
      console.warn('Could not read server WooCommerce configuration:', e);
    }
    return null;
  }, []);

  // Initialize from LocalStorage and server configuration
  useEffect(() => {
    try {
      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProds) {
        setProducts(JSON.parse(storedProds));
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (storedLogs) {
        setSyncLogs(JSON.parse(storedLogs));
      }

      const storedRules = localStorage.getItem(STORAGE_KEYS.RULES);
      if (storedRules) {
        setCategoryRules(JSON.parse(storedRules));
      }

      const storedMode = localStorage.getItem(STORAGE_KEYS.MODE) as ProviderMode;
      if (storedMode === 'demo' || storedMode === 'woocommerce') {
        setProviderModeState(storedMode);
      }
    } catch (e) {
      console.error('Failed reading from localStorage:', e);
    } finally {
      setIsHydrated(true);
      refreshServerConfig();
    }
  }, [refreshServerConfig]);

  // Save to LocalStorage whenever state changes (only non-sensitive catalog data)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed saving products to localStorage:', e);
    }
  }, [products, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(syncLogs));
    } catch (e) {
      console.warn('Failed saving logs to localStorage:', e);
    }
  }, [syncLogs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(categoryRules));
    } catch (e) {
      console.warn('Failed saving rules to localStorage:', e);
    }
  }, [categoryRules, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, providerMode);
    } catch (e) {
      console.warn('Failed saving mode to localStorage:', e);
    }
  }, [providerMode, isHydrated]);

  const activeProvider: ICatalogProvider = useMemo(() => {
    if (providerMode === 'demo') {
      return demoProvider;
    }
    return wooCommerceProvider;
  }, [providerMode]);

  const setProviderMode = (mode: ProviderMode) => {
    setProviderModeState(mode);
  };

  const addProduct = (data: ProductCreate): Product => {
    const completeness = calculateProductCompleteness(data, categoryRules);
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: `prod_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      completenessScore: completeness.score,
      missingFields: completeness.missingFields,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: ProductUpdate): Product => {
    let updatedProduct: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const merged: Product = {
          ...p,
          ...updates,
          attributes: { ...p.attributes, ...(updates.attributes || {}) },
          updatedAt: new Date().toISOString(),
        };
        const completeness = calculateProductCompleteness(merged, categoryRules);
        merged.completenessScore = completeness.score;
        merged.missingFields = completeness.missingFields;

        // If core data changed, mark pending sync
        if (merged.syncStatus === 'synced' || merged.syncStatus === 'simulated') {
          merged.syncStatus = 'pending';
        }

        updatedProduct = merged;
        return merged;
      })
    );

    if (!updatedProduct) {
      throw new Error(`Product with ID ${id} not found.`);
    }
    return updatedProduct;
  };

  const deleteProduct = (id: string): boolean => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const syncSingleProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Product not found' };
    }

    setIsSyncing(true);
    try {
      const result = await activeProvider.syncProduct(target);
      const now = new Date().toISOString();

      // Update product in list
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            syncStatus: result.syncStatus,
            lastSyncTimestamp: result.success ? now : p.lastSyncTimestamp,
            lastSyncError: result.success ? undefined : result.message,
            wooCommerceId: result.wooCommerceId || p.wooCommerceId,
            updatedAt: now,
          };
        })
      );

      // Append sync log
      const newLog: SyncLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: target.id,
        productName: target.name,
        sku: target.sku,
        provider: providerMode,
        status: result.simulated ? 'simulated' : result.success ? 'success' : 'failed',
        action: target.wooCommerceId ? 'update' : 'create',
        timestamp: now,
        message: result.message,
        wooCommerceId: result.wooCommerceId || target.wooCommerceId,
        errorDetails: result.errorDetails,
      };

      setSyncLogs((prev) => [newLog, ...prev]);

      return {
        success: result.success,
        message: result.message,
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllPending = async (): Promise<{ total: number; succeeded: number; failed: number }> => {
    const pendingProducts = products.filter(
      (p) => p.syncStatus === 'pending' || p.syncStatus === 'failed'
    );

    if (pendingProducts.length === 0) {
      return { total: 0, succeeded: 0, failed: 0 };
    }

    setIsSyncing(true);
    let succeeded = 0;
    let failed = 0;

    try {
      for (const prod of pendingProducts) {
        const res = await syncSingleProduct(prod.id);
        if (res.success) {
          succeeded++;
        } else {
          failed++;
        }
      }
      return { total: pendingProducts.length, succeeded, failed };
    } finally {
      setIsSyncing(false);
    }
  };

  const importDummyJson = async (): Promise<ImportStats> => {
    setIsSyncing(true);
    try {
      const importedList = await fetchDummyJsonProducts(8);
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      setProducts((prev) => {
        const nextProducts = [...prev];
        for (const remote of importedList) {
          const existingIndex = nextProducts.findIndex(
            (p) => p.sku.toUpperCase() === remote.sku.toUpperCase()
          );

          if (existingIndex >= 0) {
            // Update existing record
            nextProducts[existingIndex] = {
              ...nextProducts[existingIndex],
              regularPrice: remote.regularPrice,
              stockQuantity: remote.stockQuantity,
              updatedAt: new Date().toISOString(),
            };
            updatedCount++;
          } else {
            // Add new
            nextProducts.unshift(remote);
            importedCount++;
          }
        }
        return nextProducts;
      });

      const stats: ImportStats = {
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: importedList.length,
      };

      const log: SyncLog = {
        id: `log_import_${Date.now()}`,
        productId: 'bulk',
        productName: `DummyJSON Demo Catalog Import`,
        sku: 'BATCH',
        provider: 'demo',
        status: 'simulated',
        action: 'import',
        timestamp: new Date().toISOString(),
        message: `Imported ${stats.imported} new, updated ${stats.updated} sample items (${stats.total} total)`,
      };
      setSyncLogs((prev) => [log, ...prev]);

      return stats;
    } finally {
      setIsSyncing(false);
    }
  };

  const importFromCurrentProvider = async (): Promise<ImportStats> => {
    setIsSyncing(true);
    try {
      const remoteProducts = await activeProvider.importProducts();
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const now = new Date().toISOString();

      setProducts((prev) => {
        const nextProducts = [...prev];

        for (const remote of remoteProducts) {
          // Look up by WooCommerce ID or SKU to avoid duplicating
          const existingIndex = nextProducts.findIndex(
            (p) =>
              (remote.wooCommerceId && p.wooCommerceId === remote.wooCommerceId) ||
              (remote.sku && p.sku.toUpperCase() === remote.sku.toUpperCase())
          );

          if (existingIndex >= 0) {
            // Merge remote updates into local catalog record without breaking internal ID
            const existing = nextProducts[existingIndex];
            const merged: Product = {
              ...existing,
              wooCommerceId: remote.wooCommerceId || existing.wooCommerceId,
              name: remote.name,
              sku: remote.sku || existing.sku,
              description: remote.description || existing.description,
              shortDescription: remote.shortDescription || existing.shortDescription,
              regularPrice: remote.regularPrice,
              salePrice: remote.salePrice,
              stockQuantity: remote.stockQuantity,
              stockStatus: remote.stockStatus,
              category: remote.category || existing.category,
              imageUrl: remote.imageUrl || existing.imageUrl,
              attributes: { ...existing.attributes, ...remote.attributes },
              productAttributes: remote.productAttributes
                ? remote.productAttributes.map((attr) => ({
                    key: attr.key,
                    name: attr.name,
                    rawName: attr.rawName,
                    options: attr.options,
                    visible: attr.visible !== false,
                    variation: !!attr.variation,
                    position: attr.position,
                    source: attr.source,
                  }))
                : existing.productAttributes,
              status: remote.status,
              syncStatus: providerMode === 'demo' ? 'simulated' : 'synced',
              lastSyncTimestamp: now,
              updatedAt: now,
            };

            const completeness = calculateProductCompleteness(merged, categoryRules);
            merged.completenessScore = completeness.score;
            merged.missingFields = completeness.missingFields;

            nextProducts[existingIndex] = merged;
            updatedCount++;
          } else {
            // New product from WooCommerce
            const newProduct: Product = {
              ...remote,
              id: `prod_wc_${remote.wooCommerceId || Date.now().toString(36)}`,
              productAttributes: remote.productAttributes
                ? remote.productAttributes.map((attr) => ({
                    key: attr.key,
                    name: attr.name,
                    rawName: attr.rawName,
                    options: attr.options,
                    visible: attr.visible !== false,
                    variation: !!attr.variation,
                    position: attr.position,
                    source: attr.source,
                  }))
                : undefined,
              syncStatus: providerMode === 'demo' ? 'simulated' : 'synced',
              lastSyncTimestamp: now,
              createdAt: now,
              updatedAt: now,
            };
            const completeness = calculateProductCompleteness(newProduct, categoryRules);
            newProduct.completenessScore = completeness.score;
            newProduct.missingFields = completeness.missingFields;

            nextProducts.unshift(newProduct);
            importedCount++;
          }
        }

        return nextProducts;
      });

      const stats: ImportStats = {
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: remoteProducts.length,
      };

      const log: SyncLog = {
        id: `log_import_${Date.now()}`,
        productId: 'bulk',
        productName: `Import from ${activeProvider.name}`,
        sku: 'BATCH',
        provider: providerMode,
        status: providerMode === 'demo' ? 'simulated' : 'success',
        action: 'import',
        timestamp: now,
        message:
          providerMode === 'demo'
            ? `Simulated import: ${stats.imported} added, ${stats.updated} updated (${stats.total} total)`
            : `WooCommerce live import: ${stats.imported} new products imported, ${stats.updated} existing products updated (${stats.total} remote items)`,
      };
      setSyncLogs((prev) => [log, ...prev]);

      return stats;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateCategoryRules = (newRules: CategoryRule[]) => {
    setCategoryRules(newRules);
    setProducts((prev) =>
      prev.map((p) => {
        const comp = calculateProductCompleteness(p, newRules);
        return {
          ...p,
          completenessScore: comp.score,
          missingFields: comp.missingFields,
        };
      })
    );
  };

  const resetToDemoSeed = () => {
    setProducts(INITIAL_PRODUCTS);
    setSyncLogs(INITIAL_SYNC_LOGS);
    setCategoryRules(DEFAULT_CATEGORY_RULES);
    setProviderModeState('demo');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.RULES);
      localStorage.removeItem(STORAGE_KEYS.MODE);
    }
  };

  // Auto-load the WooCommerce catalog once per session when running in live mode with a
  // configured store, so the Product Catalog reflects real remote products without a manual
  // import. Importing merges into the local catalog and dedupes by WooCommerce ID / SKU.
  const autoLoadedRemoteRef = useRef(false);
  useEffect(() => {
    if (isHydrated === false) return;
    if (autoLoadedRemoteRef.current) return;
    if (providerMode !== 'woocommerce') return;
    if (!serverConfig?.isConfigured) return;
    autoLoadedRemoteRef.current = true;
    // Defer so the synchronous setIsSyncing inside the import does not run directly in the effect.
    const handle = setTimeout(() => {
      void importFromCurrentProvider().catch((err) => {
        console.error('Automatic WooCommerce product import failed:', err);
      });
    }, 0);
    return () => clearTimeout(handle);
  }, [isHydrated, providerMode, serverConfig, importFromCurrentProvider]);

  return (
    <CatalogContext.Provider
      value={{
        products,
        syncLogs,
        categoryRules,
        providerMode,
        serverConfig,
        activeProvider,
        isSyncing,
        setProviderMode,
        refreshServerConfig,
        addProduct,
        updateProduct,
        deleteProduct,
        syncSingleProduct,
        syncAllPending,
        importDummyJson,
        importFromCurrentProvider,
        updateCategoryRules,
        resetToDemoSeed,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
