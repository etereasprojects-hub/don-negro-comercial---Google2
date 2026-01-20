/*
  # Create Admin Settings and Chat System Tables

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `chat_webhook_url` (text) - URL del webhook de n8n para el chat
      - `chat_enabled` (boolean) - Controla si el chat está visible
      - `creator_logo_url` (text) - URL del logo del creador para el footer
      - `admin_password` (text) - Contraseña para acceder al panel admin
      - `updated_at` (timestamptz)

    - `chat_sessions`
      - `id` (uuid, primary key)
      - `session_id` (text, unique)
      - `customer_name` (text)
      - `messages` (jsonb) - Array de mensajes del chat
      - `ai_enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (text)
      - `updated_at` (timestamptz)

    - `site_settings`
      - `id` (uuid, primary key)
      - `business_name` (text)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (needed for chat widget)
    - Add policies for admin write access
*/

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_webhook_url text DEFAULT '',
  chat_enabled boolean DEFAULT true,
  creator_logo_url text DEFAULT '',
  admin_password text DEFAULT 'donegro2025admin',
  updated_at timestamptz DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  customer_name text DEFAULT '',
  messages jsonb DEFAULT '[]'::jsonb,
  ai_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text DEFAULT 'Don Negro Comercial',
  updated_at timestamptz DEFAULT now()
);

-- Insert default values
INSERT INTO admin_settings (id, chat_webhook_url, chat_enabled, creator_logo_url, admin_password)
VALUES (gen_random_uuid(), '', true, '', 'donegro2025admin')
ON CONFLICT DO NOTHING;

INSERT INTO site_settings (id, business_name)
VALUES (gen_random_uuid(), 'Don Negro Comercial')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies for admin_settings (public read, no auth write)
CREATE POLICY "Anyone can read admin settings"
  ON admin_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update admin settings"
  ON admin_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policies for chat_sessions (public access for chat functionality)
CREATE POLICY "Anyone can read chat sessions"
  ON chat_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update chat sessions"
  ON chat_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete chat sessions"
  ON chat_sessions FOR DELETE
  USING (true);

-- Policies for settings (public access)
CREATE POLICY "Anyone can read settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create settings"
  ON settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update settings"
  ON settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete settings"
  ON settings FOR DELETE
  USING (true);

-- Policies for site_settings (public read, write)
CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update site settings"
  ON site_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
