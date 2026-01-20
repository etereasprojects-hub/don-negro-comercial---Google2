/*
  # Add WhatsApp Fields to Store Configuration

  1. Changes
    - Add `whatsapp_number` field to store_configuration table
    - Add `whatsapp_24_7` field to store_configuration table

  2. Security
    - No changes to RLS policies needed (already public access)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_configuration' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE store_configuration ADD COLUMN whatsapp_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_configuration' AND column_name = 'whatsapp_24_7'
  ) THEN
    ALTER TABLE store_configuration ADD COLUMN whatsapp_24_7 text;
  END IF;
END $$;