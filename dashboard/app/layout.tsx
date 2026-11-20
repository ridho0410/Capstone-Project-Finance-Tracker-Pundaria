import type { Metadata, Viewport } from 'next';

import { PwaRegister } from '@/components/pwa';

import './globals.css';

export const metadata: Metadata = {
  title: 'Pundaria',
  description: 'Asisten keuangan pribadi',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pundaria',
  },
  icons: {
    icon: [
      { url: '/pundaria-logo.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0f766e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900 antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
