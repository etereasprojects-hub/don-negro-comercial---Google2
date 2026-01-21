
import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/lib/cart-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.donegro.com'),
  title: {
    default: 'Don Negro Comercial - Tu Comercial de Confianza en Paraguay',
    template: '%s | Don Negro Comercial'
  },
  description: 'Don Negro Comercial ofrece los mejores productos en electrónica, electrodomésticos, muebles, indumentaria deportiva y aire acondicionado en Asunción, Paraguay. Calidad garantizada y atención personalizada. Compra al contado o a crédito.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  keywords: [
    'Don Negro Comercial',
    'comercial Paraguay',
    'electrónica Asunción',
    'electrodomésticos Paraguay',
    'muebles Asunción',
    'aire acondicionado',
    'indumentaria deportiva',
    'compra a crédito',
    'lavarropas',
    'heladeras',
    'cocinas',
    'televisores',
    'notebooks'
  ],
  authors: [{ name: 'Don Negro Comercial' }],
  creator: 'Don Negro Comercial',
  publisher: 'Don Negro Comercial',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_PY',
    url: 'https://www.donegro.com',
    title: 'Don Negro Comercial - Tu Comercial de Confianza en Paraguay',
    description: 'Don Negro Comercial ofrece los mejores productos en electrónica, electrodomésticos, muebles y más en Paraguay. Compra al contado o a crédito.',
    siteName: 'Don Negro Comercial',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Don Negro Comercial - Tu Comercial de Confianza',
    description: 'Los mejores productos en electrónica, electrodomésticos y muebles en Paraguay.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

// Fixed React namespace error by importing React
// Changed children to be required to satisfy framework requirements and fix the missing property error
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL!} crossOrigin="anonymous" />
        <link rel="preconnect" href="https://casa-americana.b-cdn.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.innovagame.com.py" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tiendamovil.com.py" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.gonzalezgimenez.com.py" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.innovagame.com.py" />
        <link rel="dns-prefetch" href="https://tiendamovil.com.py" />
        <link rel="dns-prefetch" href="https://www.gonzalezgimenez.com.py" />
        <link rel="dns-prefetch" href="https://casa-americana.b-cdn.net" />
      </head>
      <body className={inter.className}>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
