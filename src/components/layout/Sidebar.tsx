'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  RefreshCw,
  Settings,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/attributes', label: 'Attributes', icon: SlidersHorizontal },
  { href: '/sync', label: 'Sync Center', icon: RefreshCw },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { providerMode, products } = useCatalog();

  const pendingCount = products.filter((p) => p.syncStatus === 'pending').length;
  const failedCount = products.filter((p) => p.syncStatus === 'failed').length;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-white tracking-tight flex items-center gap-1.5">
            CatalogSync
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              PIM
            </span>
          </div>
          <p className="text-xs text-slate-400">WooCommerce Hub</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Management
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.href === '/products' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {products.length}
                </span>
              )}

              {item.href === '/sync' && (pendingCount > 0 || failedCount > 0) && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    failedCount > 0
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {pendingCount + failedCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Mode Status Card */}
      <div className="p-4 border-t border-slate-800 m-3 rounded-xl bg-slate-800/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium">Active Provider</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              providerMode === 'demo'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {providerMode === 'demo' ? 'Demo' : 'WooCommerce'}
          </span>
        </div>

        <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
          {providerMode === 'demo'
            ? 'Running local sandbox. All synchronizations are labeled simulated.'
            : 'Directly communicating with remote WooCommerce REST API v3.'}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            {pendingCount > 0 ? (
              <>
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{pendingCount} Pending</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>In Sync</span>
              </>
            )}
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-1 text-rose-400">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{failedCount} Failed</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
