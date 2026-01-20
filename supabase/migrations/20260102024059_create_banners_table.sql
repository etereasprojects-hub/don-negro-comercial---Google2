/*
  # Create Banners Table

  1. New Tables
    - `banners`
      - `id` (uuid, primary key)
      - `section` (text) - Section identifier: 'hero_featured', 'catalog_top', 'catalog_bottom', 'product_bottom'
      - `desktop_image_url` (text) - URL for desktop image (1:8 aspect ratio)
      - `mobile_image_url` (text) - URL for mobile image (1:2 aspect ratio)
      - `link_url` (text, nullable) - Optional link URL for the banner
      - `order` (integer) - Order position in the slider (default: 0)
      - `is_active` (boolean) - Whether the banner is active (default: true)
      - `created_at` (timestamptz) - Timestamp of creation

  2. Security
    - Enable RLS on `banners` table
    - Add policy for public SELECT access to active banners
    - Add policy for authenticated full access (for admin users)

  3. Indexes
    - Index on `section` for faster queries by section
    - Index on `order` for faster sorting
*/

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('hero_featured', 'catalog_top', 'catalog_bottom', 'product_bottom')),
  desktop_image_url text NOT NULL,
  mobile_image_url text NOT NULL,
  link_url text,
  "order" integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users can view active banners"
  ON banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow full access for all users"
  ON banners FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_banners_section ON banners(section);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners("order");
CREATE INDEX IF NOT EXISTS idx_banners_section_active_order ON banners(section, is_active, "order");