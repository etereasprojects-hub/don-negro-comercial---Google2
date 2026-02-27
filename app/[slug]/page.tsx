import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FloatingButtons from "@/components/FloatingButtons";
import ProductClient from "@/components/ProductClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Configuración de Supabase (usamos las mismas que en lib/supabase)
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
  // Creamos el cliente de Supabase dentro de la función para asegurar que se ejecute en el servidor correctamente
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

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${product.nombre} | Don Negro Comercial`,
    description: product.descripcion?.substring(0, 160) || `Compra ${product.nombre} al mejor precio en Don Negro Comercial.`,
    openGraph: {
      title: product.nombre,
      description: product.descripcion?.substring(0, 160),
      images: [product.imagen_url, ...previousImages],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const slug = params.slug;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ProductClient product={product} />
      <Footer />
      <WhatsAppButton />
      <FloatingButtons />
    </div>
  );
}
