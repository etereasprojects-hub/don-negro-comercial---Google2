/*
  # Crear tablas para mensajes, chats, citas e IA
  
  1. Nuevas Tablas
    - `web_messages` - Mensajes de contacto recibidos desde la web
      - `id` (uuid, primary key)
      - `name` (text) - Nombre del visitante
      - `email` (text) - Email del visitante
      - `phone` (text) - Teléfono del visitante
      - `message` (text) - Mensaje enviado
      - `status` (text) - Estado: pending, read, replied
      - `created_at` (timestamptz)
      
    - `ai_chats` - Conversaciones con la IA del chatwidget
      - `id` (uuid, primary key)
      - `session_id` (text) - ID de sesión del visitante
      - `visitor_name` (text) - Nombre del visitante
      - `visitor_email` (text) - Email del visitante
      - `messages` (jsonb) - Array de mensajes [{role, content, timestamp}]
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `appointments` - Citas agendadas
      - `id` (uuid, primary key)
      - `client_name` (text) - Nombre del cliente
      - `client_email` (text) - Email del cliente
      - `client_phone` (text) - Teléfono del cliente
      - `appointment_date` (date) - Fecha de la cita
      - `appointment_time` (time) - Hora de la cita
      - `duration_minutes` (integer) - Duración en minutos
      - `service` (text) - Servicio solicitado
      - `notes` (text) - Notas adicionales
      - `status` (text) - Estado: pending, confirmed, completed, cancelled
      - `created_at` (timestamptz)
      
    - `appointment_slots` - Horarios disponibles para citas
      - `id` (uuid, primary key)
      - `day_of_week` (integer) - Día de la semana (0-6)
      - `start_time` (time) - Hora de inicio
      - `end_time` (time) - Hora de fin
      - `slot_duration_minutes` (integer) - Duración de cada slot
      - `is_active` (boolean) - Si está activo
      - `created_at` (timestamptz)
      
    - `ai_instructions` - Instrucciones para la IA
      - `id` (uuid, primary key)
      - `title` (text) - Título de la instrucción
      - `instruction` (text) - Contenido de la instrucción
      - `category` (text) - Categoría
      - `is_active` (boolean) - Si está activa
      - `priority` (integer) - Prioridad de la instrucción
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `billing_information` - Información de facturación
      - `id` (uuid, primary key)
      - `business_name` (text) - Razón social
      - `ruc` (text) - RUC/Cédula
      - `address` (text) - Dirección
      - `phone` (text) - Teléfono
      - `timbrado` (text) - Número de timbrado
      - `codigo_control` (text) - Código de control
      - `vigencia_inicio` (date) - Inicio de vigencia
      - `ruc_empresa` (text) - RUC de la empresa
      - `factura_virtual` (text) - Factura virtual
      - `invoice_prefix` (text) - Prefijo de factura (ej: 001-001-)
      - `last_invoice_number` (integer) - Último número de factura
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Seguridad
    - Enable RLS en todas las tablas
    - Políticas públicas para web_messages (inserción)
    - Políticas públicas para ai_chats y appointments (inserción)
    - Políticas de solo lectura para appointment_slots
*/

-- Tabla de mensajes web
CREATE TABLE IF NOT EXISTS web_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE web_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert messages"
  ON web_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all messages"
  ON web_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update messages"
  ON web_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de chats con IA
CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_name text,
  visitor_email text,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert chats"
  ON ai_chats FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own chat"
  ON ai_chats FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all chats"
  ON ai_chats FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  duration_minutes integer DEFAULT 60,
  service text,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert appointments"
  ON appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view available slots"
  ON appointments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (true);

-- Tabla de horarios disponibles
CREATE TABLE IF NOT EXISTS appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer DEFAULT 60,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active slots"
  ON appointment_slots FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage slots"
  ON appointment_slots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de instrucciones para IA
CREATE TABLE IF NOT EXISTS ai_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  instruction text NOT NULL,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active instructions"
  ON ai_instructions FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage instructions"
  ON ai_instructions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabla de información de facturación
CREATE TABLE IF NOT EXISTS billing_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  ruc text NOT NULL,
  address text NOT NULL,
  phone text,
  timbrado text,
  codigo_control text,
  vigencia_inicio date,
  ruc_empresa text,
  factura_virtual text,
  invoice_prefix text DEFAULT '001-001-',
  last_invoice_number integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE billing_information ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view billing info"
  ON billing_information FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage billing info"
  ON billing_information FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_web_messages_status ON web_messages(status);
CREATE INDEX IF NOT EXISTS idx_web_messages_created_at ON web_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chats_session_id ON ai_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_day ON appointment_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_ai_instructions_priority ON ai_instructions(priority DESC);