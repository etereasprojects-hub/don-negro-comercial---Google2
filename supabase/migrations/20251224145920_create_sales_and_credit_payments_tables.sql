/*
  # Crear tablas de ventas y pagos a crédito

  1. Nueva Tabla: sales
    - `id` (uuid, primary key) - Identificador único de la venta
    - `order_id` (uuid, nullable) - Referencia al pedido original
    - `customer_name` (text) - Nombre del cliente
    - `customer_phone` (text, nullable) - Teléfono del cliente
    - `customer_address` (text, nullable) - Dirección del cliente
    - `items` (jsonb) - Productos vendidos con detalles
    - `total` (numeric) - Total de la venta
    - `sale_type` (text) - Tipo de venta: 'contado' o 'credito'
    - `payment_method` (text) - Método de pago: 'efectivo', 'tarjeta', 'transferencia', etc
    - `credit_months` (integer, nullable) - Meses de crédito (solo para ventas a crédito)
    - `status` (text) - Estado: 'completada', 'pendiente', 'cancelada'
    - `created_at` (timestamptz) - Fecha de creación
    - `updated_at` (timestamptz) - Fecha de última actualización

  2. Nueva Tabla: credit_payments
    - `id` (uuid, primary key) - Identificador único del pago
    - `sale_id` (uuid) - Referencia a la venta
    - `amount_paid` (numeric) - Monto pagado
    - `payment_date` (timestamptz) - Fecha del pago
    - `notes` (text, nullable) - Notas adicionales
    - `created_at` (timestamptz) - Fecha de creación
    - `updated_at` (timestamptz) - Fecha de última actualización

  3. Seguridad
    - Enable RLS en ambas tablas
    - Políticas restrictivas para acceso completo (el dueño debe poder ver/modificar todo)
*/

-- Crear tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  items jsonb DEFAULT '[]'::jsonb,
  total numeric DEFAULT 0,
  sale_type text DEFAULT 'contado',
  payment_method text DEFAULT 'efectivo',
  credit_months integer,
  status text DEFAULT 'completada',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de pagos a crédito
CREATE TABLE IF NOT EXISTS credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  payment_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para sales (acceso completo para todas las operaciones)
CREATE POLICY "Allow all operations on sales"
  ON sales FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para credit_payments (acceso completo para todas las operaciones)
CREATE POLICY "Allow all operations on credit_payments"
  ON credit_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_order_id ON sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_credit_payments_sale_id ON credit_payments(sale_id);
