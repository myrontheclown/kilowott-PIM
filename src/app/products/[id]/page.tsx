'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useCatalog } from '@/context/CatalogContext';
import { ProductForm } from '@/components/products/ProductForm';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function EditProductContent() {
  const params = useParams();
  const id = params?.id as string;
  const { products } = useCatalog();

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-xs max-w-lg mx-auto mt-12">
        <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Product Not Found
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested product ID &quot;{id}&quot; does not exist in local catalog storage.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  return <ProductForm initialProduct={product} isEditing={true} />;
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading product information...</div>}>
      <EditProductContent />
    </Suspense>
  );
}
