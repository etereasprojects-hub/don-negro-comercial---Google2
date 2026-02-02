import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ope, ...params } = body;

    // Credenciales fijas de prueba según documentación
    const cod = "42352";
    const pas = "spW]<t&^(+-3Ha=FsfsE-aH4=?ut_1";

    const formData = new URLSearchParams();
    formData.append('cod', cod);
    formData.append('pas', pas);
    formData.append('ope', ope.toString());

    // Agregar parámetros opcionales si existen
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch('https://sisfxapi.fastrax.com.py:60253/MarketPlace/production.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Error en API Fastrax: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Fastrax Proxy Error:", error);
    return NextResponse.json({ 
      estatus: 99, 
      cestatus: error.message || "Error interno del servidor" 
    }, { status: 500 });
  }
}
