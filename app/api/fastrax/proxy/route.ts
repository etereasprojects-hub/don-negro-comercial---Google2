import { NextResponse } from 'next/server';
import https from 'https';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ope, ...params } = body;

    // Credenciales según el ejemplo PHP proporcionado
    const cod = "1234567";
    const pas = "J876B3442pP3452";
    const url = 'https://sisfxapi.fastrax.com.py:60253/MarketPlace/estatus.php';

    const formData = new URLSearchParams();
    formData.append('cod', cod);
    formData.append('pas', pas);
    formData.append('ope', ope.toString());

    // Añadir parámetros opcionales
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
          // Replaced Buffer.byteLength with TextEncoder to resolve the 'Cannot find name Buffer' TypeScript error
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
