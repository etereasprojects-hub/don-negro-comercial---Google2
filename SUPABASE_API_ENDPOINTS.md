# Supabase API Endpoints para n8n

## Información de Conexión

**Base URL:** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1`

**Headers requeridos:**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI
Content-Type: application/json
Prefer: return=representation
```

## Endpoints Disponibles

### 1. Obtener Todos los Productos Activos

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/products?estado=eq.Activo&select=*`

Retorna todos los productos activos con toda su información.

### 2. Obtener Productos Destacados

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/products?estado=eq.Activo&destacado=eq.true&select=*`

Retorna solo los productos marcados como destacados.

### 3. Buscar Producto por Nombre

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/products?nombre=ilike.*{TERMINO_BUSQUEDA}*&select=*`

Ejemplo: `products?nombre=ilike.*laptop*&select=*`

### 4. Buscar Producto por URL Slug

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/products?url_slug=eq.{slug}&select=*`

### 5. Obtener Productos por Categoría

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/products?categoria=eq.{CATEGORIA}&estado=eq.Activo&select=*`

### 6. Obtener Instrucciones del Sistema

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/instructions?select=*`

Retorna las instrucciones del sistema para el chatbot.

### 7. Obtener Categorías Disponibles

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/categories?select=*`

### 8. Crear/Actualizar Sesión de Chat

**POST/PATCH** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/chat_sessions`

Body ejemplo:
```json
{
  "session_id": "session_123456",
  "customer_name": "Cliente Ejemplo",
  "messages": [
    {
      "role": "user",
      "content": "Hola",
      "timestamp": "2025-12-24T10:00:00Z"
    }
  ],
  "ai_enabled": true
}
```

### 9. Obtener Sesión de Chat

**GET** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/chat_sessions?session_id=eq.{SESSION_ID}&select=*`

### 10. Crear Pedido

**POST** `https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/orders`

Body ejemplo:
```json
{
  "nombre_cliente": "Juan Pérez",
  "telefono": "+595981234567",
  "productos": [
    {
      "id": "uuid-del-producto",
      "nombre": "Laptop HP",
      "cantidad": 1,
      "precio": 5000000
    }
  ],
  "total": 5000000,
  "metodo_pago": "contado",
  "estado": "pendiente"
}
```

## Ejemplos de Uso en n8n

### Ejemplo 1: HTTP Request Node - Obtener Productos

```
Method: GET
URL: https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/products?estado=eq.Activo&select=*
Authentication: None
Headers:
  - Name: apikey
    Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI
  - Name: Authorization
    Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcndvb2Zrb2tjam5wYmZra2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDAxNTEsImV4cCI6MjA4MjExNjE1MX0._eqJX2OXFIvhEIcUpeM3lplKiCI-gPYsrXrJbPmcGYI
```

### Ejemplo 2: Actualizar Sesión de Chat

```
Method: PATCH
URL: https://pqrwoofkokcjnpbfkkgb.supabase.co/rest/v1/chat_sessions?session_id=eq.{{$json["sessionId"]}}
Body:
{
  "messages": {{$json["messages"]}},
  "updated_at": "{{$now}}"
}
Headers:
  - Name: apikey
    Value: [API_KEY]
  - Name: Authorization
    Value: Bearer [API_KEY]
  - Name: Content-Type
    Value: application/json
  - Name: Prefer
    Value: return=representation
```

## Filtros y Operadores de Supabase

- `eq` - Igual a
- `neq` - No igual a
- `gt` - Mayor que
- `gte` - Mayor o igual que
- `lt` - Menor que
- `lte` - Menor o igual que
- `like` - LIKE (case sensitive)
- `ilike` - LIKE (case insensitive)
- `in` - En lista
- `is` - IS (para null, true, false)
- `not` - Negación

Ejemplo: `products?costo=gte.1000000&costo=lte.5000000` (productos entre 1M y 5M)

## Notas Importantes

1. Todas las peticiones deben incluir los headers de autenticación
2. Para búsquedas de texto, usa `ilike` en lugar de `like` para que sea case-insensitive
3. Para obtener datos relacionados, usa la sintaxis de select anidado de Supabase
4. Los campos de tipo JSONB (como `messages` en chat_sessions) se manejan como objetos JSON normales
