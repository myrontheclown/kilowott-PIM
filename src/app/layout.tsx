import type { Metadata } from 'next';
import './globals.css';
import { CatalogProvider } from '@/context/CatalogContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'CatalogSync | Enterprise WooCommerce PIM',
  description: 'Product Information Management system for WooCommerce with category schemas, validation, and real-time synchronization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-slate-50 text-slate-900 font-sans">
        <CatalogProvider>
          <AppShell>{children}</AppShell>
        </CatalogProvider>
      </body>
    </html>
  );
}
