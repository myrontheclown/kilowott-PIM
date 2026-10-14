'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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

interface CatalogContextType {
  products: Product[];
  syncLogs: SyncLog[];
  categoryRules: CategoryRule[];
  providerMode: ProviderMode;
  credentials: WooCommerceCredentials;
  activeProvider: ICatalogProvider;
  isSyncing: boolean;
  setProviderMode: (mode: ProviderMode) => void;
  setCredentials: (creds: WooCommerceCredentials) => void;
  addProduct: (data: ProductCreate) => Product;
  updateProduct: (id: string, updates: ProductUpdate) => Product;
  deleteProduct: (id: string) => boolean;
  syncSingleProduct: (id: string) => Promise<{ success: boolean; message: string }>;
  syncAllPending: () => Promise<{ total: number; succeeded: number; failed: number }>;
  importDummyJson: () => Promise<number>;
  importFromCurrentProvider: () => Promise<number>;
  updateCategoryRules: (rules: CategoryRule[]) => void;
  resetToDemoSeed: () => void;
}

const CatalogContext = createContext<CatalogContextType | null>(null);

const STORAGE_KEYS = {
  PRODUCTS: 'catalog_sync_products_v1',
  LOGS: 'catalog_sync_logs_v1',
  RULES: 'catalog_sync_rules_v1',
  MODE: 'catalog_sync_mode_v1',
  CREDS: 'catalog_sync_creds_v1',
};

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(INITIAL_SYNC_LOGS);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>(DEFAULT_CATEGORY_RULES);
  const [providerMode, setProviderModeState] = useState<ProviderMode>('demo');
  const [credentials, setCredentialsState] = useState<WooCommerceCredentials>({
    storeUrl: '',
    consumerKey: '',
    consumerSecret: '',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from LocalStorage
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
      if (storedMode) {
        setProviderModeState(storedMode);
      }

      const storedCreds = localStorage.getItem(STORAGE_KEYS.CREDS);
      if (storedCreds) {
        const parsed = JSON.parse(storedCreds);
        setCredentialsState(parsed);
        wooCommerceProvider.setCredentials(parsed);
      }
    } catch (e) {
      console.error('Failed reading from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes (only after initial hydration)
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

  const setCredentials = (creds: WooCommerceCredentials) => {
    setCredentialsState(creds);
    wooCommerceProvider.setCredentials(creds);
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.CREDS, JSON.stringify(creds));
    }
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

  const importDummyJson = async (): Promise<number> => {
    setIsSyncing(true);
    try {
      const imported = await fetchDummyJsonProducts(8);
      // Filter out any duplicates by SKU or name
      const existingSkus = new Set(products.map((p) => p.sku));
      const fresh = imported.filter((p) => !existingSkus.has(p.sku));

      if (fresh.length > 0) {
        setProducts((prev) => [...fresh, ...prev]);

        // Add log
        const log: SyncLog = {
          id: `log_import_${Date.now()}`,
          productId: 'bulk',
          productName: `DummyJSON Bulk Import (${fresh.length} items)`,
          sku: 'BATCH',
          provider: 'demo',
          status: 'simulated',
          action: 'import',
          timestamp: new Date().toISOString(),
          message: `Successfully imported ${fresh.length} realistic demo products into local catalog`,
        };
        setSyncLogs((prev) => [log, ...prev]);
      }
      return fresh.length;
    } finally {
      setIsSyncing(false);
    }
  };

  const importFromCurrentProvider = async (): Promise<number> => {
    setIsSyncing(true);
    try {
      const remoteProducts = await activeProvider.importProducts();
      const existingSkus = new Set(products.map((p) => p.sku));
      const fresh = remoteProducts.filter((p) => !existingSkus.has(p.sku));

      if (fresh.length > 0) {
        setProducts((prev) => [...fresh, ...prev]);

        const log: SyncLog = {
          id: `log_import_${Date.now()}`,
          productId: 'bulk',
          productName: `Import from ${activeProvider.name}`,
          sku: 'BATCH',
          provider: providerMode,
          status: providerMode === 'demo' ? 'simulated' : 'success',
          action: 'import',
          timestamp: new Date().toISOString(),
          message: `Imported ${fresh.length} products from ${activeProvider.name}`,
        };
        setSyncLogs((prev) => [log, ...prev]);
      }
      return fresh.length;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateCategoryRules = (newRules: CategoryRule[]) => {
    setCategoryRules(newRules);
    // Re-evaluate completeness for all products against new rules
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

  return (
    <CatalogContext.Provider
      value={{
        products,
        syncLogs,
        categoryRules,
        providerMode,
        credentials,
        activeProvider,
        isSyncing,
        setProviderMode,
        setCredentials,
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
