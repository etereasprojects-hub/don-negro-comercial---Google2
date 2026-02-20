
import { NextResponse } from 'next/server';
import https from 'https';
import { Buffer } from 'buffer';

// Agente HTTPS configurado para máxima compatibilidad con servidores legacy
const agent = new https.Agent({
  rejectUnauthorized: false, // Ignora errores de certificados SSL (común en APIs antiguas)
  keepAlive: true,
  minVersion: 'TLSv1', // Permite versiones antiguas de TLS si el servidor de Fastrax es viejo
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ope, ...params } = body;

    // Credenciales de Producción
    const cod = "42352";
    const pas = "spW]<t&^(+-3Ha=FsfsE-aH4=?ut_1";
    
    // URL de Producción confirmada
    const hostname = 'sisfx247.fastrax.com.py';
    const port = 45347;
    const path = '/MarketPlace/estatus.php';

    // Construcción del FormData
    const searchParams = new URLSearchParams();
    searchParams.append('cod', cod);
    searchParams.append('pas', pas);
    searchParams.append('ope', ope.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const postData = searchParams.toString();

    console.log(`[Fastrax Proxy] Conectando a ${hostname}:${port} (OPE: ${ope})...`);

    const responseData = await new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'POST',
        agent: agent, // Usamos el agente permisivo
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'DonNegroComercial/1.0 (NodeJS)', // Identificador para evitar bloqueos de bot básicos
          'Connection': 'keep-alive'
        },
        timeout: 30000 // 30 segundos de timeout para operaciones lentas
      };

      const req = https.request(options, (res) => {
        const chunks: any[] = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Debug básico del status
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            console.error(`[Fastrax Proxy] Error HTTP remoto: ${res.statusCode}`);
            // No rechazamos inmediatamente, intentamos leer el cuerpo por si trae un error descriptivo
          }

          // OPE 3: Imagen (Binario)
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

          // Otras Operaciones: JSON
          const dataString = buffer.toString('utf-8');
          try {
            // Intentar limpiar caracteres BOM o espacios antes del JSON
            const cleanString = dataString.trim();
            
            if (!cleanString) {
               resolve({ estatus: 99, cestatus: "Respuesta vacía del servidor Fastrax" });
               return;
            }

            // A veces las APIs PHP devuelven warnings antes del JSON
            const jsonStartIndex = cleanString.indexOf('[');
            const jsonObjectStartIndex = cleanString.indexOf('{');
            let jsonString = cleanString;

            if (jsonStartIndex === -1 && jsonObjectStartIndex === -1) {
               throw new Error("No se encontró estructura JSON válida");
            }
            
            // Tomamos el primer caracter válido ( [ o { )
            const firstChar = (jsonStartIndex !== -1 && (jsonObjectStartIndex === -1 || jsonStartIndex < jsonObjectStartIndex)) 
              ? jsonStartIndex 
              : jsonObjectStartIndex;

            if (firstChar > 0) {
               console.warn("[Fastrax Proxy] Limpiando respuesta sucia:", cleanString.substring(0, firstChar));
               jsonString = cleanString.substring(firstChar);
            }

            resolve(JSON.parse(jsonString));
          } catch (e: any) {
            console.error("[Fastrax Proxy] Error parseando JSON:", e.message);
            console.error("[Fastrax Proxy] Respuesta cruda:", dataString.substring(0, 200));
            resolve({ 
              estatus: 99, 
              cestatus: "Error de formato en respuesta de Fastrax (No es JSON)", 
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
    return NextResponse.json({ 
      estatus: 99, 
      cestatus: `Error de conexión: ${error.message}`,
      debug_code: error.code || "UNKNOWN"
    }, { status: 500 });
  }
}
