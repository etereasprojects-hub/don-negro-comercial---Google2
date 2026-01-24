
import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
});

export async function generateMetadata(): Promise<Metadata> {
  const { data: config } = await supabase
    .from('store_configuration')
    .select('store_name, favicon_url')
    .maybeSingle();

  const title = config?.store_name || 'Don Negro Comercial';
  const favicon = config?.favicon_url || null;

  return {
    metadataBase: new URL('https://www.donegro.com'),
    title: {
      default: `${title} - Tu Comercial de Confianza en Paraguay`,
      template: `%s | ${title}`
    },
    description: 'Don Negro Comercial ofrece los mejores productos en electrónica, electrodomésticos, muebles, indumentaria deportiva y aire acondicionado en Asunción, Paraguay.',
    icons: favicon ? {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    } : undefined,
    keywords: [
      'Don Negro Comercial',
      'comercial Paraguay',
      'electrónica Asunción',
      'electrodomésticos Paraguay',
      'muebles Asunción',
      'aire acondicionado'
    ],
    authors: [{ name: title }],
    creator: title,
    publisher: title,
    openGraph: {
      type: 'website',
      locale: 'es_PY',
      url: 'https://www.donegro.com',
      title: `${title} - Tu Comercial de Confianza en Paraguay`,
      siteName: title,
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

/**
 * RootLayout component for the application.
 */
// Fix: Added Readonly to ensure correct prop typing for Next.js layout expectations and resolved 'children' missing error on nested components like CartProvider
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} crossOrigin="anonymous" />
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
