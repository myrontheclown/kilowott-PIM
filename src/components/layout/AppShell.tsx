'use client';

import React, { useState, Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { X } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Desktop Sidebar with Suspense */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Suspense fallback={<div className="w-64 bg-slate-900 h-full border-r border-slate-800" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Suspense fallback={<div className="w-full bg-slate-900 h-full" />}>
              <Sidebar onCloseMobile={() => setMobileOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Header onOpenMobile={() => setMobileOpen(true)} />
        </Suspense>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading catalog view...</div>}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
