/*
  # Create Store Hours Table

  1. New Tables
    - `store_hours`
      - `id` (uuid, primary key)
      - `day_of_week` (integer, 0=Domingo, 1=Lunes, 2=Martes, etc.)
      - `open_time` (text, formato HH:MM)
      - `close_time` (text, formato HH:MM)
      - `is_closed` (boolean, true si está cerrado ese día)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `store_hours` table
    - Add policies for full public access (no authentication required)
*/

CREATE TABLE IF NOT EXISTS store_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time text,
  close_time text,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Enable RLS
ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;

-- Create public policies for store_hours
CREATE POLICY "Public can view store hours"
  ON store_hours FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert store hours"
  ON store_hours FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update store hours"
  ON store_hours FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete store hours"
  ON store_hours FOR DELETE
  TO public
  USING (true);