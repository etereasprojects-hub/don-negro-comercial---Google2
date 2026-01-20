"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle } from "lucide-react";

export default function API1DocumentationPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const apiUrl = `${baseUrl.replace("https://", "https://")}/functions/v1`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
      >
        {copied === id ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Documentación API de Sincronización
          </h1>
          <p className="text-lg text-gray-600">
            Guía completa para integrar tu programa con nuestra plataforma web
          </p>
        </div>

        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Información Importante</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Todas las peticiones requieren autenticación con API Key</li>
              <li>• Los datos se envían y reciben en formato JSON</li>
              <li>• Las respuestas incluyen códigos de estado HTTP estándar</li>
              <li>• Todas las fechas están en formato ISO 8601 (UTC)</li>
            </ul>
          </CardContent>
        </Card>

        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="auth">Autenticación</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="examples">Ejemplos</TabsTrigger>
            <TabsTrigger value="errors">Errores</TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Autenticación</h2>
                <p className="text-gray-700 mb-4">
                  Todas las peticiones a la API requieren una API Key válida. Esta key debe incluirse en el header <code className="bg-gray-100 px-2 py-1 rounded">X-API-Key</code> de cada petición.
                </p>

                <h3 className="text-lg font-semibold mb-2">Obtener tu API Key</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Solo el propietario del sitio tiene acceso a las API Keys.
                    Por favor, solicita la API Key al propietario del negocio.
                  </p>
                </div>
                <p className="text-gray-700 mb-4">
                  Una vez que el propietario te proporcione la API Key, guárdala de forma segura.
                  No la compartas públicamente ni la incluyas en repositorios de código abiertos.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Para verificar que tu integración está funcionando correctamente, puedes acceder a <a href="/api-1-verification" className="text-blue-600 underline">/api-1-verification</a> con la contraseña que te proporcionó el propietario.
                </p>

                <h3 className="text-lg font-semibold mb-2">Ejemplo de Header</h3>
                <CodeBlock
                  id="auth-header"
                  code={`X-API-Key: tu_api_key_aqui`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-2xl font-bold">Sincronizar Productos</h2>
                  <Badge className="bg-green-500">POST</Badge>
                </div>

                <p className="text-gray-700 mb-4">
                  Este endpoint te permite crear o actualizar productos en la plataforma web. Si el producto ya existe (según código), se actualizará. Si no existe, se creará uno nuevo.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">URL</h3>
                    <code className="block bg-gray-100 p-3 rounded text-sm">
                      POST {apiUrl}/sync-products
                    </code>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Headers</h3>
                    <CodeBlock
                      id="products-headers"
                      code={`Content-Type: application/json
X-API-Key: tu_api_key_aqui`}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Cuerpo de la Petición (JSON)</h3>
                    <p className="text-sm text-gray-600 mb-2">Puedes enviar un solo producto o un array de productos:</p>
                    <CodeBlock
                      id="products-body"
                      code={`{
  "nombre": "Nevera Samsung 300L",
  "descripcion": "Nevera de alta eficiencia",
  "codigo_wos": "NEV-001",
  "codigo_pro": "PRO-NEV-001",
  "codigo_ext": "EXT-NEV-001",
  "categoria": "Electrodomésticos",
  "costo": 1500000,
  "stock": 5,
  "ubicacion": "En Local",
  "imagen_url": "https://example.com/imagen.jpg"
}

// O múltiples productos:
[
  { "nombre": "Producto 1", "costo": 100000, "stock": 10 },
  { "nombre": "Producto 2", "costo": 200000, "stock": 5 }
]`}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Campos</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3 font-semibold">Campo</th>
                            <th className="text-left p-3 font-semibold">Tipo</th>
                            <th className="text-left p-3 font-semibold">Requerido</th>
                            <th className="text-left p-3 font-semibold">Descripción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="p-3"><code>nombre</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="destructive">Sí</Badge></td>
                            <td className="p-3">Nombre del producto</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>costo</code></td>
                            <td className="p-3">number</td>
                            <td className="p-3"><Badge variant="destructive">Sí</Badge></td>
                            <td className="p-3">Costo del producto en pesos</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>stock</code></td>
                            <td className="p-3">number</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">Cantidad en inventario</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>descripcion</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">Descripción del producto</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>codigo_wos</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">Código interno WOS</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>codigo_pro</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">Código PRO</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>codigo_ext</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">Código externo</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>categoria</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">Categoría del producto</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>ubicacion</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">Ubicación física (default: "En Local")</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>imagen_url</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3"><Badge variant="secondary">No</Badge></td>
                            <td className="p-3">URL de la imagen del producto</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Respuesta Exitosa</h3>
                    <CodeBlock
                      id="products-response"
                      code={`{
  "success": true,
  "processed": 2,
  "results": [
    {
      "action": "created",
      "product": { "id": "uuid", "nombre": "...", ... }
    },
    {
      "action": "updated",
      "product": { "id": "uuid", "nombre": "...", ... }
    }
  ],
  "errors": [],
  "summary": {
    "created": 1,
    "updated": 1,
    "failed": 0
  },
  "processing_time_ms": 245
}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-2xl font-bold">Obtener Ventas</h2>
                  <Badge className="bg-blue-500">GET</Badge>
                </div>

                <p className="text-gray-700 mb-4">
                  Este endpoint te permite consultar las ventas realizadas en la plataforma web para sincronizarlas con tu programa.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">URL</h3>
                    <code className="block bg-gray-100 p-3 rounded text-sm">
                      GET {apiUrl}/get-sales
                    </code>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Parámetros de Consulta (Query Params)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3 font-semibold">Parámetro</th>
                            <th className="text-left p-3 font-semibold">Tipo</th>
                            <th className="text-left p-3 font-semibold">Descripción</th>
                            <th className="text-left p-3 font-semibold">Ejemplo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="p-3"><code>start_date</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3">Fecha inicial (ISO 8601)</td>
                            <td className="p-3">2024-01-01</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>end_date</code></td>
                            <td className="p-3">string</td>
                            <td className="p-3">Fecha final (ISO 8601)</td>
                            <td className="p-3">2024-12-31</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>limit</code></td>
                            <td className="p-3">number</td>
                            <td className="p-3">Cantidad de resultados (max 100)</td>
                            <td className="p-3">50</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>offset</code></td>
                            <td className="p-3">number</td>
                            <td className="p-3">Saltar N resultados</td>
                            <td className="p-3">0</td>
                          </tr>
                          <tr>
                            <td className="p-3"><code>synced</code></td>
                            <td className="p-3">boolean</td>
                            <td className="p-3">false = solo no sincronizadas</td>
                            <td className="p-3">false</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ejemplo de Petición</h3>
                    <CodeBlock
                      id="sales-request"
                      code={`GET ${apiUrl}/get-sales?synced=false&limit=10

Headers:
X-API-Key: tu_api_key_aqui`}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Respuesta</h3>
                    <CodeBlock
                      id="sales-response"
                      code={`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "cliente_nombre": "Juan Pérez",
      "cliente_telefono": "3001234567",
      "fecha_venta": "2024-01-15T10:30:00Z",
      "plan_financiamiento": "12_meses",
      "precio_total": 1200000,
      "abono_inicial": 200000,
      "saldo_pendiente": 1000000,
      "cuota_mensual": 83333,
      "metodo_pago": "efectivo",
      "synced_to_external": false,
      "products": {
        "id": "uuid",
        "nombre": "Nevera Samsung",
        "codigo_wos": "NEV-001",
        "costo": 1000000,
        "stock": 4
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25,
    "has_more": true
  },
  "processing_time_ms": 123
}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-2xl font-bold">Marcar Venta como Sincronizada</h2>
                  <Badge className="bg-green-500">POST</Badge>
                </div>

                <p className="text-gray-700 mb-4">
                  Después de procesar una venta en tu programa, marca la venta como sincronizada para no volver a procesarla.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">URL</h3>
                    <code className="block bg-gray-100 p-3 rounded text-sm">
                      POST {apiUrl}/mark-sale-synced
                    </code>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Cuerpo de la Petición</h3>
                    <CodeBlock
                      id="mark-synced-body"
                      code={`{
  "sale_id": "uuid_de_la_venta",
  "external_sale_id": "ID-12345"  // Opcional: ID en tu sistema
}`}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Respuesta</h3>
                    <CodeBlock
                      id="mark-synced-response"
                      code={`{
  "success": true,
  "sale": {
    "id": "uuid",
    "synced_to_external": true,
    "synced_at": "2024-01-15T14:20:00Z",
    "external_sale_id": "ID-12345",
    ...
  },
  "processing_time_ms": 45
}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Ejemplos de Código</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Python</h3>
                    <CodeBlock
                      id="python-example"
                      code={`import requests
import json

API_KEY = "tu_api_key_aqui"
BASE_URL = "${apiUrl}"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Sincronizar un producto
def sync_product(product_data):
    url = f"{BASE_URL}/sync-products"
    response = requests.post(url, headers=headers, json=product_data)
    return response.json()

# Obtener ventas no sincronizadas
def get_unsynced_sales():
    url = f"{BASE_URL}/get-sales?synced=false&limit=50"
    response = requests.get(url, headers=headers)
    return response.json()

# Marcar venta como sincronizada
def mark_sale_synced(sale_id, external_id=None):
    url = f"{BASE_URL}/mark-sale-synced"
    data = {"sale_id": sale_id}
    if external_id:
        data["external_sale_id"] = external_id
    response = requests.post(url, headers=headers, json=data)
    return response.json()

# Ejemplo de uso
producto = {
    "nombre": "Nevera LG 350L",
    "costo": 1800000,
    "stock": 3,
    "codigo_wos": "NEV-002"
}

result = sync_product(producto)
print(f"Producto sincronizado: {result}")`}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">C# / .NET</h3>
                    <CodeBlock
                      id="csharp-example"
                      code={`using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class APIClient
{
    private readonly HttpClient _httpClient;
    private const string API_KEY = "tu_api_key_aqui";
    private const string BASE_URL = "${apiUrl}";

    public APIClient()
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", API_KEY);
    }

    public async Task<string> SyncProduct(object productData)
    {
        var json = JsonSerializer.Serialize(productData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(
            $"{BASE_URL}/sync-products",
            content
        );

        return await response.Content.ReadAsStringAsync();
    }

    public async Task<string> GetUnsyncedSales()
    {
        var response = await _httpClient.GetAsync(
            $"{BASE_URL}/get-sales?synced=false&limit=50"
        );

        return await response.Content.ReadAsStringAsync();
    }

    public async Task<string> MarkSaleSynced(string saleId, string externalId = null)
    {
        var data = new { sale_id = saleId, external_sale_id = externalId };
        var json = JsonSerializer.Serialize(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(
            $"{BASE_URL}/mark-sale-synced",
            content
        );

        return await response.Content.ReadAsStringAsync();
    }
}

// Uso
var client = new APIClient();
var product = new {
    nombre = "Lavadora Samsung 15kg",
    costo = 2500000,
    stock = 2,
    codigo_wos = "LAV-001"
};

var result = await client.SyncProduct(product);
Console.WriteLine(result);`}
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">JavaScript / Node.js</h3>
                    <CodeBlock
                      id="javascript-example"
                      code={`const axios = require('axios');

const API_KEY = 'tu_api_key_aqui';
const BASE_URL = '${apiUrl}';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
};

// Sincronizar producto
async function syncProduct(productData) {
  try {
    const response = await axios.post(
      \`\${BASE_URL}/sync-products\`,
      productData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Obtener ventas no sincronizadas
async function getUnsyncedSales() {
  try {
    const response = await axios.get(
      \`\${BASE_URL}/get-sales?synced=false&limit=50\`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Marcar venta como sincronizada
async function markSaleSynced(saleId, externalId = null) {
  try {
    const data = { sale_id: saleId };
    if (externalId) data.external_sale_id = externalId;

    const response = await axios.post(
      \`\${BASE_URL}/mark-sale-synced\`,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Ejemplo de uso
(async () => {
  const producto = {
    nombre: 'Estufa a Gas 4 Puestos',
    costo: 800000,
    stock: 10,
    codigo_wos: 'EST-001'
  };

  const result = await syncProduct(producto);
  console.log('Producto sincronizado:', result);
})();`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Códigos de Error</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 font-semibold">Código</th>
                        <th className="text-left p-3 font-semibold">Descripción</th>
                        <th className="text-left p-3 font-semibold">Solución</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3"><Badge variant="destructive">401</Badge></td>
                        <td className="p-3">API Key no proporcionada</td>
                        <td className="p-3">Incluye el header X-API-Key en tu petición</td>
                      </tr>
                      <tr>
                        <td className="p-3"><Badge variant="destructive">403</Badge></td>
                        <td className="p-3">API Key inválida o inactiva</td>
                        <td className="p-3">Verifica que tu API Key sea correcta y esté activa</td>
                      </tr>
                      <tr>
                        <td className="p-3"><Badge variant="destructive">400</Badge></td>
                        <td className="p-3">Datos inválidos</td>
                        <td className="p-3">Revisa que los campos requeridos estén presentes y sean del tipo correcto</td>
                      </tr>
                      <tr>
                        <td className="p-3"><Badge variant="destructive">404</Badge></td>
                        <td className="p-3">Recurso no encontrado</td>
                        <td className="p-3">Verifica que el ID del recurso sea correcto</td>
                      </tr>
                      <tr>
                        <td className="p-3"><Badge variant="destructive">500</Badge></td>
                        <td className="p-3">Error interno del servidor</td>
                        <td className="p-3">Contacta al soporte técnico</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Formato de Error</h3>
                  <CodeBlock
                    id="error-format"
                    code={`{
  "error": "Descripción del error",
  "message": "Detalles adicionales",
  "processing_time_ms": 12
}`}
                  />
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Mejores Prácticas</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Implementa reintentos con backoff exponencial para errores 5xx</li>
                    <li>Valida los datos antes de enviarlos a la API</li>
                    <li>Mantén un log de todas las sincronizaciones en tu programa</li>
                    <li>Sincroniza en lotes pequeños (máximo 50 productos a la vez)</li>
                    <li>Consulta las ventas periódicamente (cada 5-10 minutos)</li>
                    <li>Marca las ventas como sincronizadas inmediatamente después de procesarlas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-green-900 mb-2">Soporte y Monitoreo</h3>
                <p className="text-green-800 mb-2">
                  Si tienes dudas o problemas con la integración:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                  <li>Revisa los logs de sincronización en <code>/api-1-verification</code> (requiere contraseña de verificación)</li>
                  <li>Solicita al propietario que revise los logs en su panel de administración</li>
                  <li>Contacta al equipo de soporte si persisten los problemas</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
