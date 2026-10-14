'use client';

import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Product } from '@/types/product';

interface DeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  product,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Delete Product
            </h3>
            <p className="text-xs text-slate-500">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3 mb-5">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-12 w-12 rounded object-cover border border-slate-200 bg-white"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">
              {product.name}
            </h4>
            <p className="text-xs text-slate-500 font-mono">
              SKU: {product.sku} • {product.category}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6">
          Are you sure you want to remove this product from CatalogSync? If it was previously synchronized with WooCommerce, remote records will remain untouched unless unlinked.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors"
          >
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}
