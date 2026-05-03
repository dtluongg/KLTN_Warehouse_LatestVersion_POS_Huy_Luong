Supplier Management - Frontend Fixes (May 3, 2026)

- Fix: Improve supplier-product delete UX and error handling in `SupplierFormScreen.tsx`.
  - File: frontend/src/features/suppliers/screens/SupplierFormScreen.tsx
  - Changes:
    - Added state `deletingProductId` to track which product is being deleted.
    - `handleRemoveProduct` now sets `deletingProductId`, calls `deleteSupplierProduct(id)`, refreshes list, logs server error to console and shows a detailed Alert with server message or status.
    - Delete button now shows an `ActivityIndicator` while deletion is in progress and is disabled during the operation.

- Rationale: Previously delete appeared to do nothing (no visual feedback). Adding spinner + detailed messages helps surface backend errors (403/401/404/500) so we can quickly triage.

- Next steps:
  - Test deletion as ADMIN and capture network response if still failing.
  - If server returns 403, confirm the JWT token is sent and role mapping (`ROLE_ADMIN`) is correct in backend.
  - If server returns 404, verify `sp.id` exists and maps to DB record.
