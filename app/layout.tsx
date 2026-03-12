import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/lib/cart-context';
import { createClient } from "@supabase/supabase-js";
import Script from 'next/script';

// Configuración de Supabase (usamos las mismas que en lib/supabase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Forzamos a que el layout se revalide siempre para captar cambios en la base de datos (favicon/nombre)
export const revalidate = 0;

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
});

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data: config } = await supabase
    .from('store_configuration')
    .select('store_name, favicon_url, og_image_url')
    .maybeSingle();

  // Si no hay nombre en la base de datos, usamos 'Don Negro Comercial' por defecto
  const storeName = config?.store_name || 'Don Negro Comercial';
  const favicon = config?.favicon_url || null;
  const ogImage = config?.og_image_url || 'https://www.donegro.com/og-image.jpg';

  // Texto exacto solicitado para la pestaña del navegador
  const fullTitle = "Don Negro Comercial, electrodomésticos, electrónica, muebles, indumentaria deportiva y mucho mas.";

  return {
    title: {
      default: fullTitle,
      template: `%s | ${storeName}`
    },
    description: 'Don Negro Comercial ofrece los mejores productos en electrónica, electrodomésticos, muebles, indumentaria deportiva y aire acondicionado en Asunción, Paraguay.',
    icons: {
      icon: favicon || '',
      shortcut: favicon || '',
      apple: favicon || '',
    },
    keywords: [
      'Don Negro Comercial',
      'comercial Paraguay',
      'electrónica Asunción',
      'electrodomésticos Paraguay',
      'muebles Asunción',
      'aire acondicionado'
    ],
    authors: [{ name: storeName }],
    creator: storeName,
    publisher: storeName,
    verification: {
      other: {
        "facebook-domain-verification": ["bz0q3hnjr2j6cdkgzf8xk48si1i9e3"],
      },
    },
    alternates: {
      canonical: 'https://www.donegro.com',
    },
    openGraph: {
      type: 'website',
      locale: 'es_PY',
      url: 'https://www.donegro.com',
      title: fullTitle,
      description: 'Don Negro Comercial ofrece los mejores productos en electrónica, electrodomésticos, muebles, indumentaria deportiva y aire acondicionado en Asunción, Paraguay.',
      siteName: storeName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Don Negro Comercial - Electrónica, Electrodomésticos y más en Asunción',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: 'Don Negro Comercial ofrece los mejores productos en electrónica, electrodomésticos, muebles, indumentaria deportiva y aire acondicionado en Asunción, Paraguay.',
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * RootLayout component for the application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-CGD8JDQF1B"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-CGD8JDQF1B');
            `,
          }}
        />

        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1149486770440852');
              fbq('track', 'PageView');
            `,
          }}
        />

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1149486770440852&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
