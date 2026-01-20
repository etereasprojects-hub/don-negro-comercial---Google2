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

export default function Home() {
  return (
    <>
      <StructuredData />
      <main className="min-h-screen">
        <Header />
        <Hero />
        <BannerSlider section="hero_featured" />
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
