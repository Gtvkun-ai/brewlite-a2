import type { Metadata, Viewport } from 'next';
import Providers from '../components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite Coffee & Tea',
  description: 'Ứng dụng đặt đồ uống cà phê & trà trực tuyến BrewLite',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BrewLite',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B4513',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
