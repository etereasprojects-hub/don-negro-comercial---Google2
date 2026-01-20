/*
  # Create Store Configuration Table

  1. New Tables
    - `store_configuration`
      - `id` (uuid, primary key) - Unique identifier
      - `store_name` (text) - Name of the store
      - `logo_url` (text) - URL to the store logo
      - `email` (text) - Store email
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
    
    - `store_locations`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text) - Location name
      - `address` (text) - Physical address
      - `phone` (text) - Contact phone
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `store_social_media`
      - `id` (uuid, primary key) - Unique identifier
      - `platform` (text) - Social media platform name
      - `url` (text) - URL to social media profile
      - `icon_name` (text) - Icon identifier for the platform
      - `display_order` (integer) - Order in which to display
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create store_configuration table
CREATE TABLE IF NOT EXISTS store_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Mi Comercio',
  logo_url text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create store_locations table
CREATE TABLE IF NOT EXISTS store_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create store_social_media table
CREATE TABLE IF NOT EXISTS store_social_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  icon_name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE store_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_social_media ENABLE ROW LEVEL SECURITY;

-- Policies for store_configuration
CREATE POLICY "Anyone can view store configuration"
  ON store_configuration FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update store configuration"
  ON store_configuration FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert store configuration"
  ON store_configuration FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for store_locations
CREATE POLICY "Anyone can view store locations"
  ON store_locations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert store locations"
  ON store_locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update store locations"
  ON store_locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete store locations"
  ON store_locations FOR DELETE
  TO authenticated
  USING (true);

-- Policies for store_social_media
CREATE POLICY "Anyone can view social media"
  ON store_social_media FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert social media"
  ON store_social_media FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update social media"
  ON store_social_media FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete social media"
  ON store_social_media FOR DELETE
  TO authenticated
  USING (true);

-- Insert default configuration
INSERT INTO store_configuration (store_name, email)
VALUES ('Mi Comercio', 'contacto@micomercio.com')
ON CONFLICT DO NOTHING;