import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Mandatorio: Forzar la revalidación del sitemap cada 1 hora para reflejar nuevos productos sin requerir redeploy en Vercel.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.donegro.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    // Instancia limpia del servidor para evitar problemas de caché del cliente singleton
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: products, error } = await supabase
      .from('products')
      .select('url_slug, updated_at')
      .eq('estado', 'Activo');

    if (error) throw error;

    const productPages: MetadataRoute.Sitemap = (products || [])
      .filter((product) => product.url_slug && product.url_slug.trim() !== '') // Bloqueo de URLs huérfanas nulas
      .map((product) => ({
        // Failsafe de Arquitectura: Forzamos el guion medio incluso si una API externa inserta guiones bajos
        url: `${baseUrl}/${product.url_slug.replace(/_/g, '-')}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
