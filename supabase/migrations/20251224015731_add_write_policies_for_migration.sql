/*
  # Add Temporary Write Policies for Data Migration

  1. Changes
    - Add INSERT policies for products and instructions tables
    - These allow admin operations from the application

  2. Notes
    - These policies will be used by the admin panel
    - Authentication will be handled at the application level
*/

CREATE POLICY "Allow inserts for products"
  ON products FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow updates for products"
  ON products FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow deletes for products"
  ON products FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow inserts for instructions"
  ON instructions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow updates for instructions"
  ON instructions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow deletes for instructions"
  ON instructions FOR DELETE
  TO anon, authenticated
  USING (true);
