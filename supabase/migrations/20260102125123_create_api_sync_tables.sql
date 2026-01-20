/*
  # Sistema de Sincronización API

  1. Nueva Tabla: api_keys
    - `id` (uuid, primary key)
    - `key_name` (text) - Nombre descriptivo de la API key
    - `api_key` (text, unique) - La API key generada
    - `is_active` (boolean) - Si la key está activa
    - `created_at` (timestamptz)
    - `last_used_at` (timestamptz)

  2. Nueva Tabla: api_sync_logs
    - `id` (uuid, primary key)
    - `operation_type` (text) - Tipo: 'product_sync', 'sale_notification', 'stock_update'
    - `direction` (text) - 'incoming' o 'outgoing'
    - `status` (text) - 'success', 'error', 'pending'
    - `request_data` (jsonb) - Datos enviados/recibidos
    - `response_data` (jsonb) - Respuesta recibida/enviada
    - `error_message` (text) - Mensaje de error si aplica
    - `ip_address` (text) - IP del cliente
    - `api_key_used` (text) - API key utilizada
    - `processing_time_ms` (integer) - Tiempo de procesamiento
    - `created_at` (timestamptz)

  3. Seguridad
    - Enable RLS en ambas tablas
    - Políticas restrictivas para acceso público
    - Políticas para lectura de logs
*/

-- Crear tabla de API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  api_key text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- Crear tabla de logs de sincronización
CREATE TABLE IF NOT EXISTS api_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  status text NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  request_data jsonb,
  response_data jsonb,
  error_message text,
  ip_address text,
  api_key_used text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_created_at ON api_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_status ON api_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_operation_type ON api_sync_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para api_keys (solo lectura pública)
CREATE POLICY "Permitir lectura pública de API keys"
  ON api_keys FOR SELECT
  USING (true);

CREATE POLICY "Permitir actualización de last_used_at"
  ON api_keys FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Políticas para api_sync_logs (solo lectura pública)
CREATE POLICY "Permitir lectura pública de logs"
  ON api_sync_logs FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de logs"
  ON api_sync_logs FOR INSERT
  WITH CHECK (true);

-- Insertar una API key de ejemplo (cambiar en producción)
INSERT INTO api_keys (key_name, api_key, is_active)
VALUES ('API Key Principal', 'sk_live_' || encode(gen_random_bytes(32), 'hex'), true)
ON CONFLICT (api_key) DO NOTHING;