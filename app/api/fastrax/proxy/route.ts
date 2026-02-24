
import { NextResponse } from 'next/server';
import https from 'https';
import { Buffer } from 'buffer';

// Configuración del Agente HTTPS para máxima compatibilidad con servidores Legacy
// Esto permite TLS antiguo y certificados auto-firmados o expirados
const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  minVersion: 'TLSv1',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ope, ...params } = body;

    // Credenciales de Producción
    const cod = "42352";
    const pas = "#eN1W2l6)g,VDMB.Qz32";
    
    // URL de Producción
    const hostname = 'sisfx247.fastrax.com.py';
    const port = 45347;
    const path = '/MarketPlace/estatus.php';

    // Preparar los datos en formato x-www-form-urlencoded (estándar PHP antiguo)
    const searchParams = new URLSearchParams();
    searchParams.append('cod', cod);
    searchParams.append('pas', pas);
    searchParams.append('ope', ope.toString());

    // Añadir el resto de parámetros dinámicos
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const postData = searchParams.toString();

    console.log(`[Fastrax Proxy] Conectando a ${hostname}:${port} (OPE: ${ope})...`);

    // Promesa para manejar la petición HTTPS nativa de Node.js
    const responseData = await new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'POST',
        agent: agent, // Usamos el agente permisivo definido arriba
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'DonNegroStore/1.0', // Identificador de cliente
          'Connection': 'keep-alive',
          'Accept': '*/*'
        },
        timeout: 30000 // 30 segundos de timeout (los servidores viejos son lentos)
      };

      const req = https.request(options, (res) => {
        const chunks: any[] = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Debug básico del status remoto
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            console.error(`[Fastrax Proxy] El servidor remoto respondió con status: ${res.statusCode}`);
          }

          // CASO 1: Es una imagen (OPE 3)
          if (ope === 3 || ope === "3") {
            if (buffer.length === 0) {
              resolve({ estatus: 1, cestatus: "Imagen vacía recibida del servidor" });
            } else {
              const base64 = buffer.toString('base64');
              const mime = res.headers['content-type'] || 'image/jpeg';
              resolve({ 
                estatus: 0, 
                cestatus: "OK", 
                type: mime,
                imageData: `data:${mime};base64,${base64}`
              });
            }
            return;
          }

          // CASO 2: Es datos (JSON)
          const dataString = buffer.toString('utf-8');
          
          try {
            // Limpieza agresiva: Los servidores PHP a veces mandan warnings antes del JSON
            // Buscamos dónde empieza realmente el JSON ([ o {)
            const jsonStartIndex = dataString.indexOf('[');
            const jsonObjectStartIndex = dataString.indexOf('{');
            
            let jsonString = dataString.trim();

            // Si hay basura antes del JSON, la cortamos
            if (jsonStartIndex !== -1 || jsonObjectStartIndex !== -1) {
                let startIndex = 0;
                if (jsonStartIndex !== -1 && jsonObjectStartIndex !== -1) {
                    startIndex = Math.min(jsonStartIndex, jsonObjectStartIndex);
                } else if (jsonStartIndex !== -1) {
                    startIndex = jsonStartIndex;
                } else {
                    startIndex = jsonObjectStartIndex;
                }
                
                jsonString = dataString.substring(startIndex);
            }

            if (!jsonString) {
               resolve({ estatus: 99, cestatus: "Respuesta vacía del servidor Fastrax" });
               return;
            }

            const parsed = JSON.parse(jsonString);
            resolve(parsed);

          } catch (e: any) {
            console.error("[Fastrax Proxy] Error parseando JSON:", e.message);
            console.error("[Fastrax Proxy] Respuesta cruda recibida:", dataString.substring(0, 500)); // Logueamos el inicio para ver qué devolvió
            
            resolve({ 
              estatus: 99, 
              cestatus: "Error de formato en respuesta de Fastrax (No es JSON válido)", 
              raw_preview: dataString.substring(0, 200) 
            });
          }
        });
      });

      req.on('error', (e: any) => {
        console.error(`[Fastrax Proxy] Error de red grave: ${e.message} (${e.code})`);
        reject({ message: e.message, code: e.code });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({ message: "Tiempo de espera agotado (30s) conectando a Fastrax.", code: "ETIMEDOUT" });
      });

      req.write(postData);
      req.end();
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("[Fastrax Proxy] Excepción interna:", error);
    return NextResponse.json({ 
      estatus: 99, 
      cestatus: `Error interno del proxy: ${error.message}`,
      debug_code: error.code || "UNKNOWN"
    }, { status: 500 });
  }
}
