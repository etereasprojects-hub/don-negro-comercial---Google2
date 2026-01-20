/*
  # Habilitar acceso público de lectura para endpoint n8n
  
  1. Cambios
    - Agregar política de lectura pública (anon) para tabla products
    - Agregar política de lectura pública (anon) para tabla instructions
    - Agregar política de lectura pública (anon) para tabla store_configuration
  
  2. Seguridad
    - Solo se permite SELECT (lectura)
    - No se permite INSERT, UPDATE o DELETE desde acceso público
    - Las operaciones de escritura siguen requiriendo autenticación
*/

-- Permitir lectura pública de productos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Allow public read access to products'
  ) THEN
    CREATE POLICY "Allow public read access to products"
      ON products
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Permitir lectura pública de instrucciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'instructions' 
    AND policyname = 'Allow public read access to instructions'
  ) THEN
    CREATE POLICY "Allow public read access to instructions"
      ON instructions
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Permitir lectura pública de configuración de tienda
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'store_configuration' 
    AND policyname = 'Allow public read access to store configuration'
  ) THEN
    CREATE POLICY "Allow public read access to store configuration"
      ON store_configuration
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;