/*
  # Create Instructions Table

  1. New Tables
    - `instructions`
      - `id` (uuid, primary key)
      - `instruction_key` (text) - Identifier for the instruction type
      - `instruction_text` (text) - Full instruction content
      - `is_active` (boolean) - Whether the instruction is active
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `instructions` table
    - Public read access for active instructions
    - No write access from public (admin panel only)
*/

CREATE TABLE IF NOT EXISTS instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_key text NOT NULL,
  instruction_text text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active instructions"
  ON instructions FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_instructions_key ON instructions(instruction_key);
CREATE INDEX IF NOT EXISTS idx_instructions_active ON instructions(is_active);
