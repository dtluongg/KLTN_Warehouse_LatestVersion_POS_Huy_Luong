-- Tạo role đọc dữ liệu nếu chưa tồn tại
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ai_reader') THEN
    CREATE ROLE ai_reader NOLOGIN;
  END IF;
END
$$;

-- Cấp quyền truy cập vào schema public
GRANT USAGE ON SCHEMA public TO ai_reader;

-- Cấp quyền SELECT trên tất cả các bảng hiện tại
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_reader;

-- Tự động cấp quyền SELECT cho các bảng tạo mới trong tương lai
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ai_reader;

-- Gán role ai_reader cho user hiện tại (ví dụ postgres) để Spring Boot có thể chạy lệnh 'SET LOCAL ROLE ai_reader'
GRANT ai_reader TO postgres;
