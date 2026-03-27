import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FloatingButtons from "@/components/FloatingButtons";
import ProductClient from "@/components/ProductClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  margen_porcentaje: number;
  interes_6_meses_porcentaje: number;
  interes_12_meses_porcentaje: number;
  interes_15_meses_porcentaje: number;
  interes_18_meses_porcentaje: number;
  imagen_url: string;
  imagenes_extra: string[];
  video_url: string;
  categoria: string;
  stock: number;
  codigo_ext: string;
  codigo_wos: string;
  codigo_pro: string;
  destacado: boolean;
  source: string;
  ubicacion: string;
  url_slug: string;
}

interface Props {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("url_slug", slug)
    .eq("estado", "Activo")
    .maybeSingle();

  if (error) {
    console.error("Error loading product:", error);
    return null;
  }

  return data;
}

async function getBanners(section: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('section', section)
    .eq('is_active', true)
    .order('order', { ascending: true });
  return data || [];
}

async function getRelatedProducts(category: string, currentProductId: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("estado", "Activo")
    .neq("id", currentProductId)
    .eq("categoria", category)
    .limit(4);
  return data || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Limpiamos el slug por si entra una URL legacy con "_" para no fallar el query de metadatos
  const cleanSlug = params.slug.replace(/_/g, '-');
  const product = await getProduct(cleanSlug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: `${product.nombre} | Don Negro Comercial`,
    description: product.descripcion?.replace(/<[^>]*>/g, '').substring(0, 160) || `Comprá ${product.nombre} al mejor precio en Don Negro Comercial, Asunción Paraguay.`,
    alternates: {
      canonical: `https://www.donegro.com/${product.url_slug}`,
    },
    openGraph: {
      type: 'website',
      locale: 'es_PY',
      url: `https://www.donegro.com/${product.url_slug}`,
      title: `${product.nombre} | Don Negro Comercial`,
      description: product.descripcion?.replace(/<[^>]*>/g, '').substring(0, 160) || `Comprá ${product.nombre} al mejor precio en Don Negro Comercial.`,
      images: product.imagen_url
        ? [{ url: product.imagen_url, width: 800, height: 800, alt: product.nombre }]
        : [{ url: 'https://www.donegro.com/og-image.jpg', width: 1200, height: 630, alt: 'Don Negro Comercial' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.nombre} | Don Negro Comercial`,
      description: product.descripcion?.replace(/<[^>]*>/g, '').substring(0, 160) || `Comprá ${product.nombre} al mejor precio en Don Negro Comercial.`,
      images: product.imagen_url ? [product.imagen_url] : ['https://www.donegro.com/og-image.jpg'],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const rawSlug = params.slug;

  // Intercepción SEO: Redirección 301 automática de URLs viejas a las nuevas
  if (rawSlug.includes('_')) {
    permanentRedirect(`/${rawSlug.replace(/_/g, '-')}`);
  }

  const product = await getProduct(rawSlug);

  if (!product) {
    notFound();
  }

  // Agregamos la consulta de relacionados basándonos en la categoría del producto actual
  const [banners, relatedProducts] = await Promise.all([
    getBanners('product_bottom'),
    getRelatedProducts(product.categoria, product.id)
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ProductClient product={product} banners={banners as any} relatedProducts={relatedProducts} />
      <Footer />
      <WhatsAppButton />
      <FloatingButtons />
    </div>
  );
}
