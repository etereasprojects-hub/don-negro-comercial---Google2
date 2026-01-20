# Configuración del Storage de Supabase para Logos

## Problema Actual

Al intentar subir logos desde el panel de administración, aparece el error:
```
Error uploading logo: StorageApiError: new row violates row-level security policy
```

## Solución: Configurar Políticas RLS en el Dashboard de Supabase

Sigue estos pasos para configurar correctamente el bucket de storage:

### Paso 1: Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Storage**

### Paso 2: Verificar el Bucket

1. Deberías ver un bucket llamado `logos`
2. Si no existe, créalo:
   - Click en "New bucket"
   - Nombre: `logos`
   - Marca como **Public bucket**
   - Click "Create bucket"

### Paso 3: Configurar Políticas RLS

1. Click en el bucket `logos`
2. Ve a la pestaña **Policies**
3. Click en "New policy"
4. Selecciona "Create a policy from scratch"

#### Política 1: SELECT (Ver archivos)

```
Policy name: Public can view logos
Policy command: SELECT
Target roles: public

USING expression:
bucket_id = 'logos'
```

#### Política 2: INSERT (Subir archivos)

```
Policy name: Anyone can upload logos
Policy command: INSERT
Target roles: public

WITH CHECK expression:
bucket_id = 'logos'
```

#### Política 3: UPDATE (Actualizar archivos)

```
Policy name: Anyone can update logos
Policy command: UPDATE
Target roles: public

USING expression:
bucket_id = 'logos'

WITH CHECK expression:
bucket_id = 'logos'
```

#### Política 4: DELETE (Eliminar archivos)

```
Policy name: Anyone can delete logos
Policy command: DELETE
Target roles: public

USING expression:
bucket_id = 'logos'
```

### Paso 4: Verificar la Configuración

Una vez configuradas las políticas, el panel de administración debería poder subir logos sin problemas.

## Alternativa: Crear las políticas con SQL (desde el SQL Editor de Supabase)

Si prefieres usar SQL, puedes ejecutar esto desde el **SQL Editor** en Supabase Dashboard:

```sql
-- Asegúrate de que el bucket existe y es público
UPDATE storage.buckets
SET public = true
WHERE id = 'logos';

-- Crear políticas para el bucket
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Anyone can upload logos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can update logos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can delete logos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'logos');
```

## Notas de Seguridad

**IMPORTANTE**: Estas políticas permiten que cualquiera suba, actualice o elimine archivos en el bucket. Esto está bien para un entorno de desarrollo o para logos del sitio que no contienen información sensible.

Para producción, considera:
- Implementar autenticación
- Restringir las políticas solo a usuarios autenticados con roles específicos
- Agregar validaciones adicionales en las políticas (tamaño de archivo, tipo MIME, etc.)

## Verificación

Después de configurar las políticas, prueba subir un logo desde el panel admin en `/admin`. Si todo está correcto, deberías ver:
1. Una notificación de "Logo cargado"
2. Una vista previa del logo en el panel
3. El logo aparecerá en el footer de todas las páginas
