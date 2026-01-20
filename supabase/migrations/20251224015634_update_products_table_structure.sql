/*
  # Update Products Table Structure

  1. Changes
    - Add `product_code` field for product identification
    - Add `url_slug` field for SEO-friendly URLs
    - Add `active` boolean field (compatible with estado)
    - Rename/map fields to match old database structure
    - Keep existing fields for backward compatibility

  2. Notes
    - `name` will map to `nombre`
    - `price` will map to `precio`
    - `category` will map to `categoria`
    - `image_url` will map to `imagen_url`
    - `active` will work alongside `estado`
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_code'
  ) THEN
    ALTER TABLE products ADD COLUMN product_code text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'url_slug'
  ) THEN
    ALTER TABLE products ADD COLUMN url_slug text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'active'
  ) THEN
    ALTER TABLE products ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products(url_slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
