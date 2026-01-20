/*
  # Corregir políticas RLS para acceso desde panel owner
  
  1. Cambios en Políticas
    - Actualizar políticas de web_messages para acceso público completo
    - Actualizar políticas de ai_chats para acceso público completo
    - Actualizar políticas de appointments para acceso público completo
    - Actualizar políticas de appointment_slots para acceso público completo
    - Actualizar políticas de ai_instructions para acceso público completo
    - Actualizar políticas de billing_information para acceso público completo
    
  2. Notas Importantes
    - Estas tablas necesitan acceso público porque el panel owner usa solo localStorage
    - No hay autenticación de Supabase en el panel owner actualmente
    - Las políticas permiten acceso completo para operaciones CRUD
*/

-- Eliminar políticas existentes y crear nuevas para web_messages
DROP POLICY IF EXISTS "Anyone can insert messages" ON web_messages;
DROP POLICY IF EXISTS "Authenticated users can view all messages" ON web_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON web_messages;

CREATE POLICY "Public can insert messages"
  ON web_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view messages"
  ON web_messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can update messages"
  ON web_messages FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete messages"
  ON web_messages FOR DELETE
  TO public
  USING (true);

-- Actualizar políticas para ai_chats
DROP POLICY IF EXISTS "Anyone can insert chats" ON ai_chats;
DROP POLICY IF EXISTS "Anyone can update their own chat" ON ai_chats;
DROP POLICY IF EXISTS "Authenticated users can view all chats" ON ai_chats;

CREATE POLICY "Public can insert chats"
  ON ai_chats FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view chats"
  ON ai_chats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can update chats"
  ON ai_chats FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete chats"
  ON ai_chats FOR DELETE
  TO public
  USING (true);

-- Actualizar políticas para appointments
DROP POLICY IF EXISTS "Anyone can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can view available slots" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON appointments;

CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view appointments"
  ON appointments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can update appointments"
  ON appointments FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete appointments"
  ON appointments FOR DELETE
  TO public
  USING (true);

-- Actualizar políticas para appointment_slots
DROP POLICY IF EXISTS "Anyone can view active slots" ON appointment_slots;
DROP POLICY IF EXISTS "Authenticated users can manage slots" ON appointment_slots;

CREATE POLICY "Public can view slots"
  ON appointment_slots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert slots"
  ON appointment_slots FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update slots"
  ON appointment_slots FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete slots"
  ON appointment_slots FOR DELETE
  TO public
  USING (true);

-- Actualizar políticas para ai_instructions
DROP POLICY IF EXISTS "Anyone can view active instructions" ON ai_instructions;
DROP POLICY IF EXISTS "Authenticated users can manage instructions" ON ai_instructions;

CREATE POLICY "Public can view instructions"
  ON ai_instructions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert instructions"
  ON ai_instructions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update instructions"
  ON ai_instructions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete instructions"
  ON ai_instructions FOR DELETE
  TO public
  USING (true);

-- Actualizar políticas para billing_information
DROP POLICY IF EXISTS "Authenticated users can view billing info" ON billing_information;
DROP POLICY IF EXISTS "Authenticated users can manage billing info" ON billing_information;

CREATE POLICY "Public can view billing info"
  ON billing_information FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert billing info"
  ON billing_information FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update billing info"
  ON billing_information FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete billing info"
  ON billing_information FOR DELETE
  TO public
  USING (true);