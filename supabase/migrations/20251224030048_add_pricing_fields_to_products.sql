/*
  # Add pricing and financing fields to products table

  1. New Fields
    - `precio_costo` (numeric) - Cost price for the product
    - `precio_contado` (numeric) - Cash/upfront payment price
    - `interes_3_meses` (numeric) - Interest percentage for 3-month financing
    - `interes_6_meses` (numeric) - Interest percentage for 6-month financing
    - `interes_9_meses` (numeric) - Interest percentage for 9-month financing
    - `interes_12_meses` (numeric) - Interest percentage for 12-month financing
    - `interes_18_meses` (numeric) - Interest percentage for 18-month financing
    - `interes_24_meses` (numeric) - Interest percentage for 24-month financing

  2. Notes
    - These fields are for admin use only and should not be displayed in the e-commerce frontend
    - All fields are optional (nullable) with sensible defaults
*/

-- Add pricing fields
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS precio_costo NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_contado NUMERIC DEFAULT 0;

-- Add interest percentage fields for different financing terms
ALTER TABLE products
ADD COLUMN IF NOT EXISTS interes_3_meses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS interes_6_meses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS interes_9_meses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS interes_12_meses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS interes_18_meses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS interes_24_meses NUMERIC DEFAULT 0;
