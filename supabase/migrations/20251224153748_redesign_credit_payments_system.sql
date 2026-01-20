/*
  # Rediseñar Sistema de Pagos a Crédito con Cuotas Mensuales

  1. Cambios en credit_payments
    - Eliminar tabla existente y recrearla con nueva estructura
    - `installment_number` (integer) - Número de cuota (1, 2, 3...)
    - `amount_due` (numeric) - Monto que debe pagarse en esta cuota
    - `amount_paid` (numeric) - Monto pagado (puede ser parcial)
    - `due_date` (date) - Fecha de vencimiento de la cuota
    - `payment_date` (date, nullable) - Fecha en que se pagó
    - `status` (text) - Estado: 'pending', 'paid', 'partial', 'overdue'
    - Mantener sale_id, notes, created_at, updated_at

  2. Notas importantes
    - Cuando se crea una venta a crédito, se crean automáticamente N cuotas
    - Cada cuota tiene su propia fecha de vencimiento (mensual)
    - Las cuotas pueden pagarse parcialmente
    - El sistema calcula automáticamente si una cuota está vencida
*/

-- Eliminar tabla existente y recrear con nueva estructura
DROP TABLE IF EXISTS credit_payments CASCADE;

CREATE TABLE credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount_due numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  payment_date date,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_installment_number CHECK (installment_number > 0),
  CONSTRAINT valid_amounts CHECK (amount_due >= 0 AND amount_paid >= 0 AND amount_paid <= amount_due),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'partial', 'overdue'))
);

-- Habilitar RLS
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- Política de acceso completo
CREATE POLICY "Allow all operations on credit_payments"
  ON credit_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_credit_payments_sale_id ON credit_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_status ON credit_payments(status);
CREATE INDEX IF NOT EXISTS idx_credit_payments_due_date ON credit_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_credit_payments_installment ON credit_payments(sale_id, installment_number);
