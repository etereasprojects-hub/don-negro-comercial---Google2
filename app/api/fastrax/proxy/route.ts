import { NextResponse } from 'next/server';
import https from 'https';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ope, ...params } = body;

    // Credenciales reales proporcionadas por el usuario
    const cod = "42352";
    const pas = "spW]<t&^(+-3Ha=FsfsE-aH4=?ut_1";
    const url = 'https://sisfxapi.fastrax.com.py:60253/MarketPlace/estatus.php';

    const formData = new URLSearchParams();
    formData.append('cod', cod);
    formData.append('pas', pas);
    formData.append('ope', ope.toString());

    // Añadir parámetros opcionales del cuerpo de la petición
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value.toString());
      }
    });

    // Usamos una promesa con el módulo https para ignorar errores de SSL
    // similar a CURLOPT_SSL_VERIFYPEER => FALSE en el ejemplo PHP
    const responseData = await new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const postData = formData.toString();

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Calculamos el byteLength de forma agnóstica al entorno
          'Content-Length': new TextEncoder().encode(postData).length
        },
        rejectUnauthorized: false // Equivalente a CURLOPT_SSL_VERIFYPEER => FALSE
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            // Fastrax devuelve el JSON como string
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ estatus: 99, cestatus: "Error parsing JSON response", raw: data });
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData);
      req.end();
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Fastrax Proxy Error:", error);
    return NextResponse.json({ 
      estatus: 99, 
      cestatus: `Error de conexión: ${error.message}` 
    }, { status: 500 });
  }
}
