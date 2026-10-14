'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/context/CatalogContext';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductFilterBar } from '@/components/products/ProductFilterBar';
import { DeleteConfirmModal } from '@/components/products/DeleteConfirmModal';
import { Product } from '@/types/product';
import { Plus, DownloadCloud, RefreshCw, Package, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ProductsPage() {
  const {
    products,
    deleteProduct,
    importDummyJson,
    importFromCurrentProvider,
    isSyncing,
    providerMode,
    serverConfig,
  } = useCatalog();

  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const handleImport = async () => {
    setNotice(null);
    try {
      const stats =
        providerMode === 'woocommerce'
          ? await importFromCurrentProvider()
          : await importDummyJson();

      setNotice({
        ok: true,
        message:
          providerMode === 'woocommerce'
            ? `Loaded ${stats.imported} new and updated ${stats.updated} existing WooCommerce products (${stats.total} remote items).`
            : `Loaded ${stats.imported} new and updated ${stats.updated} demo products (${stats.total} items).`,
      });
    } catch (err) {
      setNotice({
        ok: false,
        message: err instanceof Error ? err.message : 'Import failed. Check your WooCommerce connection in Settings.',
      });
    }
  };

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [syncStatus, setSyncStatus] = useState('all');
  const [completeness, setCompleteness] = useState('all');

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Available unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        const matchesAttr = Object.values(p.attributes).some((val) =>
          String(val).toLowerCase().includes(query)
        );
        if (!matchesName && !matchesSku && !matchesCat && !matchesAttr) {
          return false;
        }
      }

      // Category filter
      if (category !== 'all' && p.category !== category) {
        return false;
      }

      // Sync status filter
      if (syncStatus !== 'all' && p.syncStatus !== syncStatus) {
        return false;
      }

      // Completeness filter
      if (completeness === 'complete' && p.completenessScore !== 100) {
        return false;
      }
      if (completeness === 'incomplete' && p.completenessScore === 100) {
        return false;
      }

      return true;
    });
  }, [products, search, category, syncStatus, completeness]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setSyncStatus('all');
    setCompleteness('all');
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Product Catalog</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {filteredProducts.length} of {products.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product descriptions, category-specific attributes, and WooCommerce sync states
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleImport}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <DownloadCloud className={`h-4 w-4 text-slate-500 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>
              {isSyncing
                ? 'Importing...'
                : providerMode === 'woocommerce'
                ? 'Import from WooCommerce'
                : 'Import Demo Data'}
            </span>
          </button>

          <Link
            href="/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Import Result / Error Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            notice.ok
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {notice.ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-semibold">{notice.message}</div>
            {!notice.ok && providerMode === 'woocommerce' && !serverConfig?.isConfigured && (
              <div className="text-[11px] text-rose-700 mt-0.5">
                No WooCommerce credentials detected. Configure them in <Link href="/settings" className="underline font-semibold">Settings</Link>.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700"
            title="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <ProductFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        syncStatus={syncStatus}
        onSyncStatusChange={setSyncStatus}
        completeness={completeness}
        onCompletenessChange={setCompleteness}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Product Table */}
      <ProductTable
        products={filteredProducts}
        onDeleteRequest={(prod) => setProductToDelete(prod)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        product={productToDelete}
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
