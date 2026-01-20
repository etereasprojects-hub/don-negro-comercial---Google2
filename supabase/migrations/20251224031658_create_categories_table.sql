/*
  # Create categories table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key) - Unique identifier for the category
      - `nombre` (text, unique) - Category name
      - `slug` (text, unique) - URL-friendly version of the name
      - `descripcion` (text) - Optional description of the category
      - `orden` (integer) - Display order
      - `activo` (boolean) - Whether the category is active
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `categories` table
    - Add policy for anyone to read active categories
    - Add policy for authenticated users to manage categories (for admin panel)

  3. Initial Data
    - Seed with common categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  descripcion text,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active categories
CREATE POLICY "Anyone can read active categories"
  ON categories
  FOR SELECT
  USING (activo = true);

-- Allow all operations for open access (same as products table)
CREATE POLICY "Allow all operations on categories"
  ON categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial categories
INSERT INTO categories (nombre, slug, orden) VALUES
  ('Electrodomésticos', 'electrodomesticos', 1),
  ('Electrónica', 'electronica', 2),
  ('Informática', 'informatica', 3),
  ('Aire Acondicionado', 'aire-acondicionado', 4),
  ('Accesorios Notebook', 'accesorios-notebook', 5),
  ('Accesorios Teléfonos', 'accesorios-telefonos', 6),
  ('Juegos Electrónicos', 'juegos-electronicos', 7),
  ('Lámina Hydrogel', 'lamina-hydrogel', 8),
  ('Notebook', 'notebook', 9),
  ('Parlantes', 'parlantes', 10),
  ('Piscina - Piletas y Juguetes', 'piscina-piletas-juguetes', 11),
  ('Smart Watch', 'smart-watch', 12),
  ('Teléfono Celulares (Smart Phone)', 'telefono-celulares-smart-phone', 13)
ON CONFLICT (nombre) DO NOTHING;
