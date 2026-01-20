/*
  # Update pricing system

  1. Changes to products table
    - Remove columns: marca, modelo
    - Remove old pricing columns: precio, precio_contado, interes_3_meses, interes_9_meses, interes_24_meses
    - Rename precio_costo to costo
    - Add new percentage columns:
      - margen_porcentaje (default 18%)
      - interes_6_meses_porcentaje (default 45%)
      - interes_12_meses_porcentaje (default 65%)
      - interes_15_meses_porcentaje (default 75%)
      - interes_18_meses_porcentaje (default 85%)

  2. Notes
    - Prices will be calculated dynamically based on cost and percentages
    - All prices rounded up to nearest 5000
*/

-- Drop marca and modelo columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'marca'
  ) THEN
    ALTER TABLE products DROP COLUMN marca;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'modelo'
  ) THEN
    ALTER TABLE products DROP COLUMN modelo;
  END IF;
END $$;

-- Drop old pricing columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'precio'
  ) THEN
    ALTER TABLE products DROP COLUMN precio;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'precio_contado'
  ) THEN
    ALTER TABLE products DROP COLUMN precio_contado;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'interes_3_meses'
  ) THEN
    ALTER TABLE products DROP COLUMN interes_3_meses;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'interes_9_meses'
  ) THEN
    ALTER TABLE products DROP COLUMN interes_9_meses;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'interes_24_meses'
  ) THEN
    ALTER TABLE products DROP COLUMN interes_24_meses;
  END IF;
END $$;

-- Rename precio_costo to costo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'precio_costo'
  ) THEN
    ALTER TABLE products RENAME COLUMN precio_costo TO costo;
  END IF;
END $$;

-- Add new percentage columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'margen_porcentaje'
  ) THEN
    ALTER TABLE products ADD COLUMN margen_porcentaje numeric DEFAULT 18;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'interes_6_meses_porcentaje'
  ) THEN
    ALTER TABLE products ADD COLUMN interes_6_meses_porcentaje numeric DEFAULT 45;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'interes_12_meses_porcentaje'
  ) THEN
    ALTER TABLE products ADD COLUMN interes_12_meses_porcentaje numeric DEFAULT 65;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'interes_15_meses_porcentaje'
  ) THEN
    ALTER TABLE products ADD COLUMN interes_15_meses_porcentaje numeric DEFAULT 75;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'interes_18_meses_porcentaje'
  ) THEN
    ALTER TABLE products ADD COLUMN interes_18_meses_porcentaje numeric DEFAULT 85;
  END IF;
END $$;

-- Update existing products to have default percentage values if they are null
UPDATE products 
SET 
  margen_porcentaje = COALESCE(margen_porcentaje, 18),
  interes_6_meses_porcentaje = COALESCE(interes_6_meses_porcentaje, 45),
  interes_12_meses_porcentaje = COALESCE(interes_12_meses_porcentaje, 65),
  interes_15_meses_porcentaje = COALESCE(interes_15_meses_porcentaje, 75),
  interes_18_meses_porcentaje = COALESCE(interes_18_meses_porcentaje, 85)
WHERE margen_porcentaje IS NULL 
   OR interes_6_meses_porcentaje IS NULL 
   OR interes_12_meses_porcentaje IS NULL
   OR interes_15_meses_porcentaje IS NULL
   OR interes_18_meses_porcentaje IS NULL;
