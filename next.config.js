/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignoramos errores de tipos en el build para facilitar la migración de archivos legacy
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'www.innovagame.com.py' },
      { protocol: 'https', hostname: 'tiendamovil.com.py' },
      { protocol: 'https', hostname: 'www.gonzalezgimenez.com.py' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'casa-americana.b-cdn.net' }
    ],
  },
  swcMinify: true
};

module.exports = nextConfig;