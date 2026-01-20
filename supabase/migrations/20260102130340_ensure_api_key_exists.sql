/*
  # Asegurar que existe al menos una API Key

  Este script verifica si existe al menos una API Key activa.
  Si no existe ninguna, crea una automáticamente.
*/

-- Insertar una API key solo si no existe ninguna
DO $$
DECLARE
  key_count INTEGER;
BEGIN
  -- Contar cuántas API keys existen
  SELECT COUNT(*) INTO key_count FROM api_keys;
  
  -- Si no existe ninguna, crear una
  IF key_count = 0 THEN
    INSERT INTO api_keys (key_name, api_key, is_active)
    VALUES (
      'API Key Principal',
      'sk_live_' || encode(gen_random_bytes(32), 'hex'),
      true
    );
  END IF;
END $$;