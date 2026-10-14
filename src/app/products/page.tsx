'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/context/CatalogContext';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductFilterBar } from '@/components/products/ProductFilterBar';
import { DeleteConfirmModal } from '@/components/products/DeleteConfirmModal';
import { Product } from '@/types/product';
import { Plus, DownloadCloud, RefreshCw, Package } from 'lucide-react';

export default function ProductsPage() {
  const { products, deleteProduct, importDummyJson, isSyncing } = useCatalog();

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
            onClick={() => importDummyJson()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <DownloadCloud className="h-4 w-4 text-slate-500" />
            <span>Import Demo Data</span>
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
