-- Enable pgcrypto extension nếu chưa có
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert default admin staff với mã hóa password ở cấp độ DB
INSERT INTO staff (staff_code, full_name, username, password_hash, role, is_active, created_at)
VALUES ('ADMIN01', 'System Administrator', 'admin', crypt('123456', gen_salt('bf')), 'ADMIN', true, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;
