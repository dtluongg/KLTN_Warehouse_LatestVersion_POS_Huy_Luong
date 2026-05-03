Supplier Product Delete Fix (May 3, 2026)

- Root cause: Hard delete on `supplier_products` was unreliable / not aligned with the existing active/inactive lifecycle.
- Fix: Changed `SupplierProductServiceImpl.delete(Long id)` to soft-delete by setting `isActive=false` and updating `lastUpdatedAt` instead of calling `supplierProductRepository.delete(sp)`.
- Reason this works:
  - `getProductsBySupplier()` and `getSuppliersByProduct()` already filter `isActive=true`, so inactive rows disappear from the UI.
  - `create()` already reactivates an existing inactive supplier-product record and updates price, so deleted items can be restored by re-adding.
- File changed: backend/src/main/java/IUH/KLTN/LvsH/service/impl/SupplierProductServiceImpl.java

- Verification note: After this change, deleting a product from a supplier should be reflected immediately in the supplier form list without needing any FK cascade or hard-delete support.
