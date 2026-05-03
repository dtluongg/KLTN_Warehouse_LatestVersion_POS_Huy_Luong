Supplier Management - Backend Fixes (May 3, 2026)

- Fix: Prevented accidental overwrite of `supplierCode` during supplier update.
  - File: backend/src/main/java/IUH/KLTN/LvsH/service/impl/SupplierServiceImpl.java
  - Change: Only set `supplier.setSupplierCode(...)` when `request.getSupplierCode()` is not null.
  - Reason: Frontend previously sent `supplierCode: null` on update, causing DB field to become null or validation errors. Frontend now omits supplierCode when editing; backend must not overwrite with null.

- Note: After this fix, updating supplier should no longer produce 400/Bad Request due to missing supplier code. If validation errors persist, check controller/global exception handler logs for binding/validation messages.

- Next steps:
  - Restart backend server and test `PUT /api/suppliers/{id}` with a real admin token.
  - Verify supplierCode remains unchanged after update.
  - Test delete supplier-product flow as ADMIN and confirm 204 response.
