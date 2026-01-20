/*
  # Simplify RLS Policies for Open Access

  1. Changes
    - Drop all existing restrictive policies
    - Create simple policies that allow public access without authentication
    - Apply to both products and instructions tables

  2. Security Notes
    - This configuration allows full public access
    - Suitable for admin-only applications without user authentication
    - Access control should be handled at the application level
*/

-- Drop all existing policies for products
DROP POLICY IF EXISTS "Permitir lectura pública de productos activos" ON products;
DROP POLICY IF EXISTS "Permitir inserción de productos" ON products;
DROP POLICY IF EXISTS "Permitir actualización de productos" ON products;
DROP POLICY IF EXISTS "Permitir eliminación de productos" ON products;
DROP POLICY IF EXISTS "Allow inserts for products" ON products;
DROP POLICY IF EXISTS "Allow updates for products" ON products;
DROP POLICY IF EXISTS "Allow deletes for products" ON products;

-- Drop all existing policies for instructions
DROP POLICY IF EXISTS "Anyone can view active instructions" ON instructions;
DROP POLICY IF EXISTS "Allow inserts for instructions" ON instructions;
DROP POLICY IF EXISTS "Allow updates for instructions" ON instructions;
DROP POLICY IF EXISTS "Allow deletes for instructions" ON instructions;

-- Create simple open access policies for products
CREATE POLICY "Public read access for products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert access for products"
  ON products FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update access for products"
  ON products FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access for products"
  ON products FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create simple open access policies for instructions
CREATE POLICY "Public read access for instructions"
  ON instructions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert access for instructions"
  ON instructions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update access for instructions"
  ON instructions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access for instructions"
  ON instructions FOR DELETE
  TO anon, authenticated
  USING (true);
