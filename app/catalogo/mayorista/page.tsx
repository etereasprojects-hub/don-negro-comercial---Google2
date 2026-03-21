import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import FloatingButtons from '@/components/FloatingButtons';
import BannerSlider from '@/components/BannerSlider';
import MayoristaClient from '@/components/MayoristaClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Catálogo Mayorista | Don Negro Comercial',
  robots: {
    index: false,
    follow: false,
  },
};

async function getWholesaleProducts() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data } = await supabase
    .from('products')
    .select('id, nombre, url_slug, costo, margen_porcentaje, imagen_url, descripcion, categoria, stock, ubicacion, source, estado, active, precio_mayorista, factor_mayorista, min_cantidad_mayorista')
    .or('estado.eq.Activo,active.eq.true')
    .order('nombre');

  return data || [];
}

async function getBanners(section: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('section', section)
    .eq('is_active', true)
    .order('order', { ascending: true });
  return data || [];
}

export default async function WholesaleProductsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  const [products, bannersTop, bannersBottom] = await Promise.all([
    getWholesaleProducts(),
    getBanners('catalog_top'),
    getBanners('catalog_bottom'),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFDFD] pt-24 pb-20">
        <BannerSlider banners={bannersTop as any} />
        <MayoristaClient 
          initialProducts={products as any} 
          userEmail={user?.email || ''} 
        />
        <BannerSlider banners={bannersBottom as any} />
      </main>
      <Footer />
      <WhatsAppButton />
      <FloatingButtons />
    </>
  );
}
