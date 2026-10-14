'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/product';
import { CompletenessBadge } from './CompletenessBadge';
import { SyncStatusBadge } from './SyncStatusBadge';
import {
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Tag,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';

interface ProductTableProps {
  products: Product[];
  onDeleteRequest: (product: Product) => void;
}

export function ProductTable({ products, onDeleteRequest }: ProductTableProps) {
  const { syncSingleProduct, isSyncing } = useCatalog();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = async (product: Product) => {
    setSyncingId(product.id);
    try {
      await syncSingleProduct(product.id);
    } finally {
      setSyncingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-xs">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <Tag className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          No matching products found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Try adjusting your search criteria or clearing active filters to view available items.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Product Details</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Price</th>
              <th className="py-3.5 px-4">Stock</th>
              <th className="py-3.5 px-4">Completeness</th>
              <th className="py-3.5 px-4">Sync Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const isItemSyncing = isSyncing && syncingId === product.id;

              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Product Details (Image, Title, SKU) */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-11 w-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        onError={(e) => {
                          // Fallback placeholder image on error
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/products/${product.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 truncate block transition-colors max-w-xs"
                          title={product.name}
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono">{product.sku}</span>
                          {product.status === 'draft' ? (
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Draft
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Published
                            </span>
                          )}
                          {product.wooCommerceId && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #WC-{product.wooCommerceId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200/60">
                      {product.category.replace('-', ' ')}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-baseline gap-1.5">
                      {product.salePrice && product.salePrice > 0 ? (
                        <>
                          <span className="font-bold text-slate-900">
                            ${product.salePrice.toFixed(2)}
                          </span>
                          <span className="line-through text-slate-400 text-[11px]">
                            ${product.regularPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-slate-900">
                          ${product.regularPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          product.stockQuantity > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-medium text-slate-800">
                        {product.stockQuantity} in stock
                      </span>
                    </div>
                  </td>

                  {/* Completeness */}
                  <td className="py-3.5 px-4">
                    <CompletenessBadge
                      score={product.completenessScore}
                      missingFields={product.missingFields}
                    />
                  </td>

                  {/* Sync Status */}
                  <td className="py-3.5 px-4">
                    <SyncStatusBadge
                      status={product.syncStatus}
                      lastSyncTimestamp={product.lastSyncTimestamp}
                      lastSyncError={product.lastSyncError}
                      onRetry={() => handleSync(product)}
                      isRetrying={isItemSyncing}
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Quick Sync */}
                      <button
                        type="button"
                        onClick={() => handleSync(product)}
                        disabled={isItemSyncing || isSyncing}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Sync with WooCommerce"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${isItemSyncing ? 'animate-spin text-indigo-600' : ''}`}
                        />
                      </button>

                      {/* Edit */}
                      <Link
                        href={`/products/${product.id}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(product)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
