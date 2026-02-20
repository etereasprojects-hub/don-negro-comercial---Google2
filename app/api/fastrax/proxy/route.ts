
import { NextResponse } from 'next/server';
import https from 'https';
// Added import for Buffer to fix "Cannot find name 'Buffer'" error in TypeScript
import { Buffer } from 'buffer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ope, ...params } = body;

    // Credenciales reales proporcionadas por el usuario
    const cod = "42352";
    const pas = "spW]<t&^(+-3Ha=FsfsE-aH4=?ut_1";
    // Updated URL based on user request
    const url = 'https://sisfx247.fastrax.com.py:45347/MarketPlace/estatus.php';

    const formData = new URLSearchParams();
    formData.append('cod', cod);
    formData.append('pas', pas);
    formData.append('ope', ope.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value.toString());
      }
    });

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
          'Content-Length': new TextEncoder().encode(postData).length
        },
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        // Usamos un array para recolectar chunks binarios
        const chunks: any[] = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          // Comment: Buffer is now explicitly imported to fix line 49 error
          const buffer = Buffer.concat(chunks);
          
          // Si la operación es 3 (Imagen), devolvemos Base64
          if (ope === 3 || ope === "3") {
            if (buffer.length === 0) {
              resolve({ estatus: 1, cestatus: "Imagen no encontrada o vacía" });
            } else {
              const base64 = buffer.toString('base64');
              resolve({ 
                estatus: 0, 
                cestatus: "OK", 
                type: res.headers['content-type'],
                imageData: `data:${res.headers['content-type'] || 'image/jpeg'};base64,${base64}`
              });
            }
            return;
          }

          // Para otras operaciones, intentamos parsear JSON
          const dataString = buffer.toString('utf-8');
          try {
            resolve(JSON.parse(dataString));
          } catch (e) {
            resolve({ estatus: 99, cestatus: "Error parsing JSON", raw: dataString.substring(0, 500) });
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
