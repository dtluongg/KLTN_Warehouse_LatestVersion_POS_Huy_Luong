-- Add payment status and payos order code to orders table
ALTER TABLE orders 
ADD COLUMN payos_order_code VARCHAR(100);

-- Create index for quick lookup by payos_order_code
CREATE INDEX idx_orders_payos_order_code ON orders(payos_order_code);
