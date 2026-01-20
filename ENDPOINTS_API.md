# Endpoints de la API de Sincronización

## Base URL
Todos los endpoints están bajo la URL de Supabase Functions.

## Obtener la API Key

**Importante:** Solo el propietario del sitio tiene acceso a las API Keys.

**Para el propietario:**
1. Accede a `/owner` (contraseña: donegro2025owner)
2. Ve a la pestaña "Conexión API"
3. Haz clic en "API Keys"
4. Copia la API Key que aparece
5. Compártela de forma segura con el programador

**Para el programador:**
- Solicita la API Key al propietario del negocio
- Guárdala de forma segura y no la compartas públicamente

## Endpoints Disponibles

### 1. POST /functions/v1/sync-products
Sincroniza productos desde el programa a la web.

**Headers:**
- X-API-Key: [tu_api_key]
- Content-Type: application/json

**Body:**
```json
{
  "nombre": "Producto Ejemplo",
  "costo": 100000,
  "stock": 10,
  "codigo_wos": "PROD-001"
}
```

### 2. GET /functions/v1/get-sales
Consulta ventas de la web.

**Headers:**
- X-API-Key: [tu_api_key]

**Query Params:**
- synced=false (solo no sincronizadas)
- limit=50
- offset=0

### 3. POST /functions/v1/mark-sale-synced
Marca venta como sincronizada.

**Headers:**
- X-API-Key: [tu_api_key]
- Content-Type: application/json

**Body:**
```json
{
  "sale_id": "uuid",
  "external_sale_id": "ID-123"
}
```

## Documentación Completa

Visita `/api-1` para la documentación completa con ejemplos de código.

## Monitoreo

**Para el propietario:**
- Visita `/owner/conexion-api` para ver todos los logs de sincronización

**Para el programador:**
- Visita `/api-1-verification` (contraseña: donegro2025apiverification)
- Podrás ver todos los logs de sincronización en tiempo real
- Estadísticas de operaciones exitosas y errores
- Detalles completos de cada petición y respuesta
