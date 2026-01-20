/*
  # Agregar campo show_in_hero a productos

  1. Cambios en la tabla products
    - Agregar columna `show_in_hero` (boolean) - Indica si el producto se muestra en el hero slider
    - Por defecto: false

  2. Notas importantes
    - El campo `destacado` se usa para la grilla de productos destacados
    - El campo `show_in_hero` se usa para el slider del hero
    - Son independientes y pueden estar ambos activos
*/

-- Agregar columna show_in_hero si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'show_in_hero'
  ) THEN
    ALTER TABLE products ADD COLUMN show_in_hero boolean DEFAULT false;
  END IF;
END $$;
