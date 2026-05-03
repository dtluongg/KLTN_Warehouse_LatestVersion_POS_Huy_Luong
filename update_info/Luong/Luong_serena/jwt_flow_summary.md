Tóm tắt luồng JWT — Hệ thống Warehouse + POS

1) Mục tiêu bảo mật
- Giảm rủi ro nếu access token bị lộ bằng cách dùng access token ngắn hạn.
- Tránh lưu refresh token plaintext trên server bằng cách chỉ lưu hash.
- Chặn replay refresh token bằng rotation và revoke.
- Bảo vệ login khỏi brute-force bằng rate-limit theo IP.

2) Mô hình token
- Access token: JWT HMAC-signed, dùng cho mọi request được bảo vệ bằng `Authorization: Bearer ...`.
- Refresh token: chuỗi opaque, không phải JWT, dùng để xin access token mới.
- Server lưu refresh token trong bảng `auths` dưới dạng `token_hash`, không lưu raw token.
- Khi login/refresh thành công, backend trả `accessToken` và `refreshToken` mới; web nhận refresh token qua HttpOnly cookie.

3) Backend security mechanisms
- `JwtTokenProvider`: tạo access token và nhét các claim quan trọng như `role` và `staff_id`.
- `JwtAuthenticationFilter`: đọc bearer token, validate chữ ký và hạn dùng, sau đó dựng `Authentication` vào `SecurityContext`.
- `CustomUserDetails`: chuyển `Staff.role` thành `ROLE_<ROLE_NAME>` để Spring Security dùng với `hasRole(...)`.
- `RefreshTokenService`: sinh refresh token ngẫu nhiên, hash bằng SHA-256, lưu DB, validate, revoke, và revoke toàn bộ token active của user khi cần.
- `AuthController`: xử lý login/refresh/logout, set cookie cho web, và rate-limit login theo IP.

4) Ý nghĩa các cơ chế chính
- Hash refresh token: nếu DB bị lộ thì attacker không đọc được token gốc.
- Revoke: đánh dấu token cũ là vô hiệu bằng `revokedAt` thay vì xóa bản ghi.
- Rotation: mỗi lần refresh hợp lệ sẽ cấp token mới và làm token cũ mất hiệu lực.
- Dedupe: frontend chỉ cho phép một refresh đang chạy tại một thời điểm để tránh nhiều request refresh song song.
- Rate-limit: giới hạn số lần đăng nhập sai trong một cửa sổ thời gian.

5) Luồng login để vẽ sequence
Actors: `User` → `Frontend` → `AuthController` → `LoginRateLimitService` → `AuthService` → `AuthenticationManager` → `JwtTokenProvider` / `RefreshTokenService` → `DB`.

Sequence:
1. User nhập username/password trên frontend.
2. Frontend gọi `POST /api/auth/login`.
3. `AuthController` lấy IP, gọi `loginRateLimitService.assertAllowed(clientIp)`.
4. Nếu bị chặn thì trả `429 Too Many Requests`.
5. Nếu được phép, `AuthService.login(...)` xác thực credentials qua `AuthenticationManager`.
6. Spring Security load `CustomUserDetails` từ `Staff`.
7. `JwtTokenProvider.generateAccessToken(...)` tạo access token có claim `role` và `staff_id`.
8. `RefreshTokenService.issueRefreshToken(...)` tạo refresh token mới, hash và lưu vào bảng `auths`.
9. `AuthController` trả `AuthResponseDTO`.
10. Nếu là web, controller set `refresh_token` qua HttpOnly cookie; nếu là mobile, token được trả trong body.
11. Frontend lưu access token và role, rồi chuyển vào app.

6) Luồng refresh để vẽ sequence
Actors: `Frontend` → `AuthController` → `RefreshTokenService` → `AuthService` → `JwtTokenProvider` → `DB`.

Sequence:
1. Access token hết hạn hoặc 401 từ API.
2. Frontend interceptor gọi `/api/auth/refresh`.
3. Mobile gửi raw refresh token trong body; web dùng cookie HttpOnly.
4. `AuthController` resolve refresh token từ body hoặc cookie.
5. `AuthService.refresh(...)` gọi `RefreshTokenService.validateAndMarkUsed(...)`.
6. Service kiểm tra hash, expiry, `revokedAt`.
7. Nếu hợp lệ, backend revoke token cũ và issue token mới.
8. Backend tạo access token mới với cùng quyền của user.
9. Frontend nhận session mới và retry request gốc.

7) Luồng role / phân quyền để vẽ sequence
Actors: `Frontend` → `JwtAuthenticationFilter` → `CustomUserDetailsService` → `SecurityContext` → `@PreAuthorize`-protected controller.

Sequence:
1. Frontend gọi endpoint có `Authorization: Bearer <accessToken>`.
2. `JwtAuthenticationFilter` validate JWT và lấy username từ token.
3. Filter load user từ DB, tạo `Authentication` với authorities `ROLE_ADMIN`, `ROLE_SALES_STAFF`, hoặc `ROLE_WAREHOUSE_STAFF`.
4. Spring Security đặt `Authentication` vào `SecurityContext`.
5. Controller hoặc method-level security kiểm tra `@PreAuthorize("hasRole('ADMIN')")` hay `hasAnyRole(...)`.
6. Nếu authority khớp thì request chạy tiếp; nếu không thì bị từ chối.

8) Frontend liên quan đến role
- `authStore` lưu role hiện tại để render UI và giữ trạng thái sau refresh.
- `roleAccess.ts` quyết định menu/route nào được mở cho từng role.
- `CustomDrawerContent`, `HomeScreen`, `StaffFormScreen`, `CustomerReturnListScreen`, `SupplierReturnListScreen`, `StockAdjustmentListScreen`, `PurchaseOrderListScreen` đều dùng role để ẩn/hiện thao tác.

9) Rủi ro & khuyến nghị
- `JWT_SECRET_KEY` phải đủ mạnh, tốt nhất 256-bit trở lên.
- Phải chạy Flyway V22 + V23 để DB có bảng `auths`.
- Web nên để refresh token trong HttpOnly Secure cookie với `SameSite=Lax` hoặc `Strict`.
- Rate-limit login nên giữ nguyên và theo dõi log bất thường.
- Mobile nên dùng secure storage của OS và giữ chính sách rotation/revoke server-side.

10) File quan trọng
- Backend: `AuthController`, `AuthService`, `RefreshTokenService`, `JwtTokenProvider`, `JwtAuthenticationFilter`, `CustomUserDetails`, `SecurityConfig`.
- Frontend: `src/api/axiosClient.ts`, `src/api/authApi.ts`, `src/store/authStore.ts`, `src/utils/roleAccess.ts`, `src/components/CustomDrawerContent.tsx`.

Created by Serena agent on May 3, 2026.
