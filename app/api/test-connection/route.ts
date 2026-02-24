import { NextResponse } from 'next/server';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false,
  minVersion: 'TLSv1' as any,
});

export async function GET() {
  const startTime = Date.now();
  
  try {
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'sisfxapi.fastrax.com.py',
        port: 60253,
        path: '/MarketPlace/production.php',
        method: 'GET',
        agent,
        timeout: 10000,
      }, (res) => {
        resolve({ 
          status: res.statusCode, 
          headers: res.headers,
          elapsed: Date.now() - startTime + 'ms'
        });
      });

      req.on('error', (e: any) => reject({ error: e.message, code: e.code, elapsed: Date.now() - startTime + 'ms' }));
      req.on('timeout', () => { req.destroy(); reject({ error: 'TIMEOUT', elapsed: Date.now() - startTime + 'ms' }); });
      req.end();
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}
