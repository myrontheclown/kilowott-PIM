'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductCreate, ProductStatus, StockStatus } from '@/types/product';
import { useCatalog } from '@/context/CatalogContext';
import { calculateProductCompleteness } from '@/lib/completeness';
import { getCategoryRule } from '@/lib/default-rules';
import { ProductSchema } from '@/lib/validation';
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface ProductFormProps {
  initialProduct?: Product;
  isEditing?: boolean;
}

export function ProductForm({ initialProduct, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const {
    addProduct,
    updateProduct,
    categoryRules,
    syncSingleProduct,
    isSyncing,
    providerMode,
  } = useCatalog();

  // Core Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [category, setCategory] = useState(initialProduct?.category || 'clothing');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || '');
  const [regularPrice, setRegularPrice] = useState<string>(
    initialProduct?.regularPrice !== undefined ? String(initialProduct.regularPrice) : ''
  );
  const [salePrice, setSalePrice] = useState<string>(
    initialProduct?.salePrice !== undefined ? String(initialProduct.salePrice) : ''
  );
  const [stockQuantity, setStockQuantity] = useState<string>(
    initialProduct?.stockQuantity !== undefined ? String(initialProduct.stockQuantity) : '10'
  );
  const [stockStatus, setStockStatus] = useState<StockStatus>(
    initialProduct?.stockStatus || 'instock'
  );
  const [imageUrl, setImageUrl] = useState(
    initialProduct?.imageUrl ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
  );
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status || 'draft');

  // Category & Custom Attributes State
  const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>(
    initialProduct?.attributes || {}
  );
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');

  // UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Active Category Rule
  const currentCategoryRule = useMemo(() => {
    return getCategoryRule(category, categoryRules);
  }, [category, categoryRules]);

  // Real-time completeness calculation
  const currentFormData: Partial<Product> = useMemo(() => {
    return {
      name,
      sku,
      category,
      description,
      shortDescription,
      regularPrice: parseFloat(regularPrice) || 0,
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      stockStatus,
      imageUrl,
      attributes,
      status,
    };
  }, [
    name,
    sku,
    category,
    description,
    shortDescription,
    regularPrice,
    salePrice,
    stockQuantity,
    stockStatus,
    imageUrl,
    attributes,
    status,
  ]);

  const completeness = useMemo(() => {
    return calculateProductCompleteness(currentFormData, categoryRules);
  }, [currentFormData, categoryRules]);

  // Handle attribute updates
  const handleAttributeChange = (key: string, value: string | number | boolean) => {
    setAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddCustomAttribute = () => {
    if (!customKey.trim() || !customValue.trim()) return;
    const cleanKey = customKey.trim().toLowerCase().replace(/\s+/g, '-');
    setAttributes((prev) => ({
      ...prev,
      [cleanKey]: customValue.trim(),
    }));
    setCustomKey('');
    setCustomValue('');
  };

  const handleRemoveAttribute = (key: string) => {
    setAttributes((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // Form submission
  const handleSubmit = async (targetStatus: ProductStatus) => {
    setFormError(null);

    // Rule enforcement: Prevent publishing if incomplete!
    if (targetStatus === 'published' && !completeness.canPublish) {
      setFormError(
        `Cannot publish product: ${completeness.publishBlockers[0] || 'Incomplete required attributes'}. Please complete all required fields.`
      );
      return;
    }

    const parsedRegularPrice = parseFloat(regularPrice);
    const parsedSalePrice = salePrice ? parseFloat(salePrice) : undefined;
    const parsedStock = parseInt(stockQuantity, 10);

    const payload: ProductCreate = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      description: description.trim(),
      shortDescription: shortDescription.trim() || undefined,
      regularPrice: isNaN(parsedRegularPrice) ? 0 : parsedRegularPrice,
      salePrice: parsedSalePrice !== undefined && !isNaN(parsedSalePrice) ? parsedSalePrice : undefined,
      stockQuantity: isNaN(parsedStock) ? 0 : parsedStock,
      stockStatus,
      imageUrl: imageUrl.trim(),
      attributes,
      status: targetStatus,
    };

    // Zod validation check
    const validation = ProductSchema.safeParse(payload);
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialProduct) {
        updateProduct(initialProduct.id, payload);
      } else {
        addProduct(payload);
      }
      router.push('/products');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectSync = async () => {
    if (!initialProduct) return;
    setSyncFeedback(null);
    const res = await syncSingleProduct(initialProduct.id);
    setSyncFeedback(res.message);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? `Edit: ${initialProduct?.name}` : 'Create New Product'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? `ID: ${initialProduct?.id} • SKU: ${initialProduct?.sku}`
                : 'Configure master product information and category attribute definitions'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleDirectSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all ${
              completeness.canPublish
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-indigo-300 text-white cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Publish Product</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-150">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Validation Block</div>
            <p className="mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {/* Direct Sync Feedback */}
      {syncFeedback && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-900 animate-in fade-in duration-150">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Synchronization Feedback</div>
            <p className="mt-0.5">{syncFeedback}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Core Info & Attributes */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Master Product Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Merino Wool Crewneck Sweater"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. APP-MRN-001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer capitalize"
                >
                  <option value="clothing">Clothing & Apparel</option>
                  <option value="electronics">Consumer Electronics</option>
                  <option value="home-goods">Home & Living</option>
                  <option value="beauty">Beauty & Personal Care</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed product specifications, materials, and features..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Description (Optional)
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief summary displayed on WooCommerce listing cards"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Regular Price ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sale Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Optional discounted price"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="instock">In Stock</option>
                  <option value="outofstock">Out of Stock</option>
                  <option value="onbackorder">On Backorder</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Category Attributes Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Category Attributes Schema ({currentCategoryRule?.label || category})
                </h3>
                <p className="text-xs text-slate-500">
                  Required fields must be populated to satisfy catalog completeness and publish eligibility
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentCategoryRule?.attributes.length || 0} fields
              </span>
            </div>

            {/* Render Category Defined Attributes */}
            {currentCategoryRule && currentCategoryRule.attributes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCategoryRule.attributes.map((attr) => {
                  const val = attributes[attr.key] !== undefined ? String(attributes[attr.key]) : '';
                  const isMissing = attr.required && (!val || val.trim().length === 0);

                  return (
                    <div key={attr.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          {attr.label}{' '}
                          {attr.required && <span className="text-rose-500">*</span>}
                        </label>
                        {attr.unit && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{attr.unit}]
                          </span>
                        )}
                      </div>

                      {attr.type === 'select' && attr.options ? (
                        <select
                          value={val}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer ${
                            isMissing ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                        >
                          <option value="">Select {attr.label}...</option>
                          {attr.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attr.type === 'number' ? 'number' : 'text'}
                          value={val}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          placeholder={attr.description || `Enter ${attr.label}...`}
                          className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
                            isMissing ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No predefined attribute rules configured for this category. You can add custom attributes below.
              </p>
            )}

            {/* Custom Key-Value Attributes Section */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                Custom Product Key-Value Attributes
              </h4>

              {/* Existing Custom Attributes */}
              {Object.keys(attributes).filter(
                (k) => !currentCategoryRule?.attributes.some((r) => r.key === k)
              ).length > 0 && (
                <div className="space-y-2 mb-3">
                  {Object.entries(attributes)
                    .filter(([k]) => !currentCategoryRule?.attributes.some((r) => r.key === k))
                    .map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{key}:</span>
                          <span className="text-slate-900">{String(val)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(key)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Add Custom Attribute Row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="Attribute Key (e.g. designer)"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Value (e.g. Studio OMA)"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAttribute}
                  className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Completeness Widget & Media */}
        <div className="space-y-6">
          {/* Completeness Calculator Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Completeness Score
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  completeness.isComplete
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {completeness.score}%
              </span>
            </div>

            {/* Score Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    completeness.isComplete
                      ? 'bg-emerald-500'
                      : completeness.score >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Validation Progress</span>
                <span>{completeness.canPublish ? 'Ready to publish' : 'Draft only'}</span>
              </div>
            </div>

            {/* Missing Fields Checklist */}
            <div className="pt-2">
              <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Requirements Checklist
              </h4>

              {completeness.missingFields.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>All required product specifications satisfied!</span>
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {completeness.missingFields.map((field, idx) => (
                    <li
                      key={idx}
                      className="p-2 rounded bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{field}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Media Image Preview */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Product Image URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 mb-3"
              />

              <div className="aspect-square w-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    No image URL provided
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
