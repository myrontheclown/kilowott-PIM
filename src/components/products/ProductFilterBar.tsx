'use client';

import React from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { ProductCategory, SyncStatus } from '@/types/product';

interface ProductFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  syncStatus: string;
  onSyncStatusChange: (val: string) => void;
  completeness: string;
  onCompletenessChange: (val: string) => void;
  categories: string[];
  onReset: () => void;
}

export function ProductFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  syncStatus,
  onSyncStatusChange,
  completeness,
  onCompletenessChange,
  categories,
  onReset,
}: ProductFilterBarProps) {
  const isFiltered =
    search.trim() !== '' ||
    category !== 'all' ||
    syncStatus !== 'all' ||
    completeness !== 'all';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by title, SKU, or attribute..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>

          {/* Sync Status Dropdown */}
          <select
            value={syncStatus}
            onChange={(e) => onSyncStatusChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value="all">All Sync Statuses</option>
            <option value="synced">Synced (Live)</option>
            <option value="simulated">Simulated (Demo)</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Completeness Dropdown */}
          <select
            value={completeness}
            onChange={(e) => onCompletenessChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value="all">All Completeness</option>
            <option value="complete">100% Complete</option>
            <option value="incomplete">Incomplete (&lt;100%)</option>
          </select>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
