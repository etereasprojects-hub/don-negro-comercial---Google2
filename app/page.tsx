import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import FeaturedProducts from '@/components/FeaturedProducts';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import FloatingButtons from '@/components/FloatingButtons';
import AutoTooltips from '@/components/AutoTooltips';
import StructuredData from '@/components/StructuredData';
import BannerSlider from '@/components/BannerSlider';

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

async function getHeroImage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'hero_image_url')
    .single();
  return data?.value || null;
}

export default async function Home() {
  const [banners, heroImage] = await Promise.all([
    getBanners('hero_featured'),
    getHeroImage(),
  ]);

  return (
    <>
      <StructuredData />
      <main className="min-h-screen">
        <Header />
        <Hero heroImage={heroImage} />
        <BannerSlider banners={banners as any} />
        <FeaturedProducts />
        <About />
        <Contact />
        <Footer />
        <WhatsAppButton />
        <FloatingButtons />
        <AutoTooltips />
      </main>
    </>
  );
}
