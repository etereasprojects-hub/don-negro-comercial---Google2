import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import FloatingButtons from '@/components/FloatingButtons';
import BannerSlider from '@/components/BannerSlider';
import ProductsClient from '@/components/ProductsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Catálogo | Don Negro Comercial',
  description: 'Explorá el catálogo completo de Don Negro Comercial. Electrodomésticos, electrónica, muebles, indumentaria deportiva y más al mejor precio en Asunción, Paraguay.',
  openGraph: {
    title: 'Catálogo | Don Negro Comercial',
    description: 'Explorá el catálogo completo de Don Negro Comercial.',
    url: 'https://www.donegro.com/productos',
    siteName: 'Don Negro Comercial',
    images: [{ url: 'https://pjydwqblhhmdsybpzbzx.supabase.co/storage/v1/object/public/logos/logos/og-image-1773278974104.jpg', width: 1200, height: 630, alt: 'Don Negro Comercial Catálogo' }],
    locale: 'es_PY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo | Don Negro Comercial',
    description: 'Explorá el catálogo completo de Don Negro Comercial.',
    images: ['https://pjydwqblhhmdsybpzbzx.supabase.co/storage/v1/object/public/logos/logos/og-image-1773278974104.jpg'],
  },
  alternates: {
    canonical: 'https://www.donegro.com/productos',
  },
};

async function getProducts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data } = await supabase
    .from('products')
    .select('id, nombre, url_slug, costo, margen_porcentaje, interes_6_meses_porcentaje, interes_12_meses_porcentaje, interes_15_meses_porcentaje, interes_18_meses_porcentaje, imagen_url, descripcion, categoria, stock, ubicacion, source, estado, active')
    .or('estado.eq.Activo,active.eq.true')
    .order('nombre');

  return data || [];
}

async function getBanners(section: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('section', section)
    .eq('is_active', true)
    .order('order', { ascending: true });
  return data || [];
}

export default async function ProductsPage() {
  const [products, bannersTop, bannersBottom] = await Promise.all([
    getProducts(),
    getBanners('catalog_top'),
    getBanners('catalog_bottom'),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFDFD] pt-24 pb-20">
        <BannerSlider banners={bannersTop as any} />
        <ProductsClient initialProducts={products as any} />
        <BannerSlider banners={bannersBottom as any} />
      </main>
      <Footer />
      <WhatsAppButton />
      <FloatingButtons />
    </>
  );
}
