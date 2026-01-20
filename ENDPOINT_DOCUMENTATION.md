# Endpoint para Actualizar Costos de Productos

## URL del Endpoint

```
https://pqrwoofkokcjnpbfkkgb.supabase.co/functions/v1/update-product-cost
```

## Método HTTP

`POST`

## Headers Requeridos

```
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

## Opciones de Uso

### 1. Actualizar un solo producto

**Request Body:**
```json
{
  "codigo_ext": "ABC123",
  "costo": 150000
}
```

**Response (Éxito):**
```json
{
  "success": true,
  "message": "Costo actualizado exitosamente",
  "product_name": "ADAPTADOR APPLE 20W"
}
```

**Response (Error - Producto no encontrado):**
```json
{
  "success": false,
  "message": "Producto no encontrado con ese código externo"
}
```

### 2. Actualizar múltiples productos (Recomendado para n8n)

**Request Body:**
```json
{
  "productos": [
    {
      "codigo_ext": "ABC123",
      "costo": 150000
    },
    {
      "codigo_ext": "XYZ789",
      "costo": 200000
    },
    {
      "codigo_ext": "DEF456",
      "costo": 300000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "updated": 2,
  "failed": 1,
  "results": [
    {
      "codigo_ext": "ABC123",
      "success": true,
      "message": "Costo actualizado exitosamente",
      "product_name": "ADAPTADOR APPLE 20W"
    },
    {
      "codigo_ext": "XYZ789",
      "success": true,
      "message": "Costo actualizado exitosamente",
      "product_name": "CABLE USB TIPO C"
    },
    {
      "codigo_ext": "DEF456",
      "success": false,
      "message": "Producto no encontrado"
    }
  ]
}
```

## Configuración en n8n

### HTTP Request Node

1. **Method:** POST
2. **URL:** `https://pqrwoofkokcjnpbfkkgb.supabase.co/functions/v1/update-product-cost`
3. **Authentication:** None (usa headers)
4. **Headers:**
   - Name: `Content-Type`, Value: `application/json`
   - Name: `Authorization`, Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI`
5. **Body Content Type:** JSON
6. **Specify Body:** Using JSON
7. **JSON:**
   ```json
   {
     "productos": {{ $json.productos }}
   }
   ```

### Ejemplo de Flujo n8n

1. **Obtener datos de la base antigua** (Supabase Node o HTTP Request)
   - Query: `SELECT codigo_ext, costo FROM products WHERE costo > 0`

2. **Transformar datos** (Code Node o Function Node)
   ```javascript
   // Transformar formato
   const productos = items.map(item => ({
     codigo_ext: item.json.codigo_ext,
     costo: item.json.costo
   }));

   return [{ json: { productos } }];
   ```

3. **Enviar al endpoint** (HTTP Request Node)
   - Configurar como se indicó arriba

4. **Verificar resultados** (IF Node o Function Node)
   - Verificar que `success === true`
   - Revisar cantidad de `updated` vs `failed`

## Notas Importantes

- El endpoint busca productos por `codigo_ext` (código externo)
- Si un producto no existe, se reporta en los resultados pero no detiene el proceso
- Todos los costos se actualizan en una sola llamada
- El campo `updated_at` se actualiza automáticamente
- No hay límite en la cantidad de productos que puedes enviar, pero se recomienda procesar en lotes de 100-500 productos

## Códigos de Estado HTTP

- `200`: Éxito (puede incluir fallos individuales en el array de resultados)
- `400`: Request inválido (falta información requerida)
- `404`: Producto no encontrado (solo para actualización individual)
- `500`: Error del servidor

## Testing con cURL

```bash
# Actualizar un producto
curl -X POST 'https://pqrwoofkokcjnpbfkkgb.supabase.co/functions/v1/update-product-cost' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI' \
  -d '{"codigo_ext":"ABC123","costo":150000}'

# Actualizar múltiples productos
curl -X POST 'https://pqrwoofkokcjnpbfkkgb.supabase.co/functions/v1/update-product-cost' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI' \
  -d '{"productos":[{"codigo_ext":"ABC123","costo":150000},{"codigo_ext":"XYZ789","costo":200000}]}'
```
