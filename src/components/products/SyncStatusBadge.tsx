'use client';

import React, { useState } from 'react';
import { SyncStatus } from '@/types/product';
import { Check, Clock, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  lastSyncTimestamp?: string;
  lastSyncError?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function SyncStatusBadge({
  status,
  lastSyncTimestamp,
  lastSyncError,
  onRetry,
  isRetrying,
}: SyncStatusBadgeProps) {
  const [showErrorModal, setShowErrorModal] = useState(false);

  const getBadgeConfig = () => {
    switch (status) {
      case 'synced':
        return {
          label: 'Synced',
          icon: Check,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'simulated':
        return {
          label: 'Simulated',
          icon: Sparkles,
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: AlertTriangle,
          color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer',
          dot: 'bg-rose-500',
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          icon: Clock,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <>
      <div
        onClick={() => {
          if (status === 'failed' && lastSyncError) {
            setShowErrorModal(true);
          }
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${config.color}`}
        title={
          status === 'failed'
            ? 'Click to view error log and retry'
            : lastSyncTimestamp
            ? `Last synced: ${new Date(lastSyncTimestamp).toLocaleTimeString()}`
            : undefined
        }
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
      </div>

      {/* Error Details Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Synchronization Failure
                </h3>
                <p className="text-xs text-slate-500">WooCommerce Remote Response</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-rose-700 break-words mb-5 whitespace-pre-wrap">
              {lastSyncError || 'Unknown remote sync failure'}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => {
                    setShowErrorModal(false);
                    onRetry();
                  }}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>Retry Sync</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
