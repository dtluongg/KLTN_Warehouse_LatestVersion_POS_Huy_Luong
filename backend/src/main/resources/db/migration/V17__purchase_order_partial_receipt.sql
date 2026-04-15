ALTER TABLE purchase_orders
    ADD COLUMN receipt_progress VARCHAR(50) NOT NULL DEFAULT 'NOT_RECEIVED',
    ADD COLUMN closed_at TIMESTAMP NULL,
    ADD COLUMN closed_reason VARCHAR(50) NULL,
    ADD COLUMN allow_over_receipt BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE goods_receipt_items
    ALTER COLUMN po_item_id SET NOT NULL;

CREATE INDEX idx_goods_receipts_po_id ON goods_receipts(po_id);
CREATE INDEX idx_goods_receipt_items_po_item_id ON goods_receipt_items(po_item_id);

WITH po_item_receipts AS (
    SELECT
        poi.po_id,
        poi.id AS po_item_id,
        poi.ordered_qty,
        COALESCE(SUM(CASE WHEN gr.status = 'POSTED' THEN gri.received_qty ELSE 0 END), 0) AS received_qty
    FROM purchase_order_items poi
    LEFT JOIN goods_receipt_items gri ON gri.po_item_id = poi.id
    LEFT JOIN goods_receipts gr ON gr.id = gri.gr_id
    GROUP BY poi.po_id, poi.id, poi.ordered_qty
),
po_receipt_summary AS (
    SELECT
        po_id,
        COALESCE(SUM(received_qty), 0) AS total_received,
        BOOL_AND(received_qty >= ordered_qty) AS fully_received
    FROM po_item_receipts
    GROUP BY po_id
)
UPDATE purchase_orders po
SET receipt_progress = CASE
        WHEN prs.total_received = 0 THEN 'NOT_RECEIVED'
        WHEN prs.fully_received THEN 'FULLY_RECEIVED'
        ELSE 'PARTIALLY_RECEIVED'
    END,
    closed_at = CASE
        WHEN prs.fully_received THEN COALESCE(po.closed_at, po.created_at, CURRENT_TIMESTAMP)
        ELSE po.closed_at
    END,
    closed_reason = CASE
        WHEN prs.fully_received THEN 'FULLY_RECEIVED'
        ELSE po.closed_reason
    END
FROM po_receipt_summary prs
WHERE po.id = prs.po_id;
