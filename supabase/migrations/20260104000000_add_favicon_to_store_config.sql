/*
  # Añadir soporte para favicon dinámico

  1. Cambios
    - Añadir columna `favicon_url` a la tabla `store_configuration` para almacenar la URL del ícono del sitio.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_configuration' AND column_name = 'favicon_url'
  ) THEN
    ALTER TABLE store_configuration ADD COLUMN favicon_url text;
  END IF;
END $$;