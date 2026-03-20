-- Triggers sinh mã số chứng từ tự động cho 6 loại Phiếu
-- Định dạng: PREFIX + YYYYMMDD + 4 số sequence (vd: ORD202310240001)

-- 1. ORDERS
CREATE SEQUENCE IF NOT EXISTS seq_order_no START 1;
CREATE OR REPLACE FUNCTION set_order_no() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_no IS NULL OR NEW.order_no = '' THEN
    NEW.order_no := 'ORD' || to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('seq_order_no')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_order_no
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION set_order_no();


-- 2. PURCHASE ORDERS (PO)
CREATE SEQUENCE IF NOT EXISTS seq_po_no START 1;
CREATE OR REPLACE FUNCTION set_po_no() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_no IS NULL OR NEW.po_no = '' THEN
    NEW.po_no := 'PO' || to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('seq_po_no')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_po_no
BEFORE INSERT ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION set_po_no();


-- 3. GOODS RECEIPTS (GR)
CREATE SEQUENCE IF NOT EXISTS seq_gr_no START 1;
CREATE OR REPLACE FUNCTION set_gr_no() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gr_no IS NULL OR NEW.gr_no = '' THEN
    NEW.gr_no := 'GR' || to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('seq_gr_no')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_gr_no
BEFORE INSERT ON goods_receipts
FOR EACH ROW EXECUTE FUNCTION set_gr_no();


-- 4. CUSTOMER RETURNS (CR)
CREATE SEQUENCE IF NOT EXISTS seq_cr_no START 1;
CREATE OR REPLACE FUNCTION set_cr_no() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_no IS NULL OR NEW.return_no = '' THEN
    NEW.return_no := 'CR' || to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('seq_cr_no')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_cr_no
BEFORE INSERT ON customer_returns
FOR EACH ROW EXECUTE FUNCTION set_cr_no();


-- 5. SUPPLIER RETURNS (SR)
CREATE SEQUENCE IF NOT EXISTS seq_sr_no START 1;
CREATE OR REPLACE FUNCTION set_sr_no() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_no IS NULL OR NEW.return_no = '' THEN
    NEW.return_no := 'SR' || to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('seq_sr_no')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_sr_no
BEFORE INSERT ON supplier_returns
FOR EACH ROW EXECUTE FUNCTION set_sr_no();


-- 6. STOCK ADJUSTMENTS (SA)
CREATE SEQUENCE IF NOT EXISTS seq_sa_no START 1;
CREATE OR REPLACE FUNCTION set_sa_no() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.adjust_no IS NULL OR NEW.adjust_no = '' THEN
    NEW.adjust_no := 'SA' || to_char(CURRENT_DATE, 'YYYYMMDD') || LPAD(nextval('seq_sa_no')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_sa_no
BEFORE INSERT ON stock_adjustments
FOR EACH ROW EXECUTE FUNCTION set_sa_no();
