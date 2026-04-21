-- =============================================================================
-- V18: Auto-generate codes for customer_code, staff_code, supplier_code
--      at the database trigger level (PostgreSQL)
--
-- Format:
--   customer_code : KH-00001 → KH-100000 (lpad 5, tự mở rộng nếu > 99999)
--   staff_code    : NV-00001 → NV-100000
--   supplier_code : NCC-00001 → NCC-100000
--
-- Logic: Lấy MAX số hiện tại trong cột → +1 → format lại
-- Trigger chỉ kích hoạt khi customer_code / staff_code / supplier_code = NULL
-- nên vẫn cho phép set thủ công từ form nếu muốn.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CUSTOMERS  →  customer_code = KH-XXXXX
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_gen_customer_code()
RETURNS TRIGGER AS $$
DECLARE
    v_next  BIGINT;
    v_seq   TEXT;
BEGIN
    IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
        -- Extract the numeric part from existing codes of format 'KH-NNNNN'
        SELECT COALESCE(
            MAX(
                CASE
                    WHEN customer_code ~ '^KH-[0-9]+$'
                    THEN CAST(SUBSTRING(customer_code FROM 4) AS BIGINT)
                    ELSE 0
                END
            ), 0
        ) + 1
        INTO v_next
        FROM customers;

        -- Zero-pad to at least 5 digits, auto-extend if larger
        v_seq := LPAD(v_next::TEXT, 5, '0');
        NEW.customer_code := 'KH-' || v_seq;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gen_customer_code ON customers;
CREATE TRIGGER trg_gen_customer_code
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION fn_gen_customer_code();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. STAFF  →  staff_code = NV-XXXXX
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_gen_staff_code()
RETURNS TRIGGER AS $$
DECLARE
    v_next  BIGINT;
    v_seq   TEXT;
BEGIN
    IF NEW.staff_code IS NULL OR NEW.staff_code = '' THEN
        SELECT COALESCE(
            MAX(
                CASE
                    WHEN staff_code ~ '^NV-[0-9]+$'
                    THEN CAST(SUBSTRING(staff_code FROM 4) AS BIGINT)
                    ELSE 0
                END
            ), 0
        ) + 1
        INTO v_next
        FROM staff;

        v_seq := LPAD(v_next::TEXT, 5, '0');
        NEW.staff_code := 'NV-' || v_seq;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gen_staff_code ON staff;
CREATE TRIGGER trg_gen_staff_code
    BEFORE INSERT ON staff
    FOR EACH ROW
    EXECUTE FUNCTION fn_gen_staff_code();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SUPPLIERS  →  supplier_code = NCC-XXXXX
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_gen_supplier_code()
RETURNS TRIGGER AS $$
DECLARE
    v_next  BIGINT;
    v_seq   TEXT;
BEGIN
    IF NEW.supplier_code IS NULL OR NEW.supplier_code = '' THEN
        SELECT COALESCE(
            MAX(
                CASE
                    WHEN supplier_code ~ '^NCC-[0-9]+$'
                    THEN CAST(SUBSTRING(supplier_code FROM 5) AS BIGINT)
                    ELSE 0
                END
            ), 0
        ) + 1
        INTO v_next
        FROM suppliers;

        v_seq := LPAD(v_next::TEXT, 5, '0');
        NEW.supplier_code := 'NCC-' || v_seq;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gen_supplier_code ON suppliers;
CREATE TRIGGER trg_gen_supplier_code
    BEFORE INSERT ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION fn_gen_supplier_code();
