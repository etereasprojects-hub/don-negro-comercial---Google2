/*
  # Add Product Media Gallery

  1. New Columns
    - `imagenes_extra` (jsonb) - Array of up to 5 extra image URLs
      Example: ["url1", "url2", "url3"]
    - `video_url` (text) - YouTube video URL
      Example: "https://www.youtube.com/watch?v=VIDEO_ID"

  2. Changes
    - Add imagenes_extra column to store extra product images (max 5)
    - Add video_url column to store YouTube video URL
    - Create indexes for better query performance

  3. Notes
    - imagenes_extra is stored as JSONB array for flexibility
    - video_url is a simple text field for YouTube URLs
    - Both fields are optional (nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'imagenes_extra'
  ) THEN
    ALTER TABLE products ADD COLUMN imagenes_extra jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE products ADD COLUMN video_url text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_imagenes_extra ON products USING GIN (imagenes_extra);
