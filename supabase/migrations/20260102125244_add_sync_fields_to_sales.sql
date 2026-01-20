/*
  # Agregar campos de sincronización a ventas

  1. Cambios en tabla sales
    - `synced_to_external` (boolean) - Si la venta ya fue sincronizada al sistema externo
    - `synced_at` (timestamptz) - Cuándo se sincronizó
    - `external_sale_id` (text) - ID de la venta en el sistema externo

  2. Índices
    - Índice en synced_to_external para consultas rápidas
*/

-- Agregar campos de sincronización
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'synced_to_external'
  ) THEN
    ALTER TABLE sales ADD COLUMN synced_to_external boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE sales ADD COLUMN synced_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'external_sale_id'
  ) THEN
    ALTER TABLE sales ADD COLUMN external_sale_id text;
  END IF;
END $$;

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_sales_synced_to_external ON sales(synced_to_external) WHERE synced_to_external = false;