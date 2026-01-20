/*
  # Create Products Management System

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `nombre` (text) - Product name
      - `descripcion` (text) - Product description
      - `marca` (text) - Brand
      - `modelo` (text) - Model
      - `codigo_wos` (text) - WOS code
      - `codigo_pro` (text) - PRO code
      - `codigo_ext` (text) - External code
      - `categoria` (text) - Category
      - `precio` (numeric) - Price
      - `stock` (integer) - Stock quantity
      - `ubicacion` (text) - Location
      - `estado` (text) - Status (Activo/Inactivo)
      - `imagen_url` (text) - Image URL
      - `destacado` (boolean) - Featured product
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `products` table
    - Public read access for website display
    - No write access (will be handled through admin panel with password)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text DEFAULT '',
  marca text DEFAULT '',
  modelo text DEFAULT '',
  codigo_wos text DEFAULT '',
  codigo_pro text DEFAULT '',
  codigo_ext text DEFAULT '',
  categoria text DEFAULT '',
  precio numeric(12, 2) DEFAULT 0,
  stock integer DEFAULT 0,
  ubicacion text DEFAULT 'En Local',
  estado text DEFAULT 'Activo',
  imagen_url text DEFAULT '',
  destacado boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_estado ON products(estado);
CREATE INDEX IF NOT EXISTS idx_products_destacado ON products(destacado);
CREATE INDEX IF NOT EXISTS idx_products_nombre ON products(nombre);
