-- Auto-generate URL anh san pham tu Supabase Storage vao bang products.
-- Supabase project ref: lxvjoidcvegxzinahtgi
-- Bucket mac dinh: product-images (public)
--
-- Sau khi chay migration nay, moi san pham se co URL theo mau:
-- https://lxvjoidcvegxzinahtgi.supabase.co/storage/v1/object/public/product-images/products/<sku-slug>.jpg
--
-- Ban upload anh tay len dung path o tren la hien duoc ngay.

CREATE TEMP TABLE tmp_product_image_import (
    sku VARCHAR(100) PRIMARY KEY,
    image_url VARCHAR(1000) NOT NULL
);

INSERT INTO tmp_product_image_import (sku, image_url)
SELECT
    p.sku,
    'https://lxvjoidcvegxzinahtgi.supabase.co/storage/v1/object/public/product-images/products/'
    || regexp_replace(lower(p.sku), '[^a-z0-9]+', '-', 'g')
  || '.jpg' AS image_url
FROM products p
WHERE p.deleted_at IS NULL
  AND COALESCE(NULLIF(TRIM(p.sku), ''), '') <> '';

UPDATE products p
SET image_url = t.image_url,
    updated_at = CURRENT_TIMESTAMP
FROM tmp_product_image_import t
WHERE p.sku = t.sku
  AND p.deleted_at IS NULL
  AND COALESCE(NULLIF(TRIM(t.image_url), ''), '') <> '';

DROP TABLE IF EXISTS tmp_product_image_import;
