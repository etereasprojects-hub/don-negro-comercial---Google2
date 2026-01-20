/*
  # Update Store Configuration Policies for Public Access

  This migration removes authentication requirements from all store configuration tables,
  allowing full public access for reading and writing data.

  1. Changes
    - Drop existing restrictive policies
    - Create new public policies for all operations (SELECT, INSERT, UPDATE, DELETE)
    - Apply to: store_configuration, store_locations, store_social_media

  2. Security
    - Full public access enabled for all operations
    - No authentication required
*/

-- Drop existing policies for store_configuration
DROP POLICY IF EXISTS "Anyone can view store configuration" ON store_configuration;
DROP POLICY IF EXISTS "Authenticated users can update store configuration" ON store_configuration;
DROP POLICY IF EXISTS "Authenticated users can insert store configuration" ON store_configuration;

-- Create new public policies for store_configuration
CREATE POLICY "Public can view store configuration"
  ON store_configuration FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert store configuration"
  ON store_configuration FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update store configuration"
  ON store_configuration FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete store configuration"
  ON store_configuration FOR DELETE
  TO public
  USING (true);

-- Drop existing policies for store_locations
DROP POLICY IF EXISTS "Anyone can view store locations" ON store_locations;
DROP POLICY IF EXISTS "Authenticated users can insert store locations" ON store_locations;
DROP POLICY IF EXISTS "Authenticated users can update store locations" ON store_locations;
DROP POLICY IF EXISTS "Authenticated users can delete store locations" ON store_locations;

-- Create new public policies for store_locations
CREATE POLICY "Public can view store locations"
  ON store_locations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert store locations"
  ON store_locations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update store locations"
  ON store_locations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete store locations"
  ON store_locations FOR DELETE
  TO public
  USING (true);

-- Drop existing policies for store_social_media
DROP POLICY IF EXISTS "Anyone can view social media" ON store_social_media;
DROP POLICY IF EXISTS "Authenticated users can insert social media" ON store_social_media;
DROP POLICY IF EXISTS "Authenticated users can update social media" ON store_social_media;
DROP POLICY IF EXISTS "Authenticated users can delete social media" ON store_social_media;

-- Create new public policies for store_social_media
CREATE POLICY "Public can view social media"
  ON store_social_media FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert social media"
  ON store_social_media FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update social media"
  ON store_social_media FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete social media"
  ON store_social_media FOR DELETE
  TO public
  USING (true);