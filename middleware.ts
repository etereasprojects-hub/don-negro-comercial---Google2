import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const url = request.nextUrl.clone();

  // Proteger /owner/*
  if (url.pathname.startsWith('/owner') && !url.pathname.startsWith('/owner/login')) {
    if (!session) {
      url.pathname = '/owner/login';
      return NextResponse.redirect(url);
    }

    // Verificar si es owner (no tiene user_profile)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      // Si tiene perfil, es un cliente, no el owner
      url.pathname = '/owner/login';
      // Podríamos cerrar sesión aquí o simplemente redirigir con un error
      return NextResponse.redirect(url);
    }
  }

  // Proteger /catalogo/mayorista/*
  if (url.pathname.startsWith('/catalogo/mayorista')) {
    if (!session) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, active')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'mayorista' || !profile.active) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/owner/:path*', '/catalogo/mayorista/:path*'],
};
