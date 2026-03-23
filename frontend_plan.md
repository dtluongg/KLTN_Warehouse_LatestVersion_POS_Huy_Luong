# UI Spec V1 - Frontend Mobile First (POS + Warehouse)

Tai lieu nay dinh huong thiet ke lai UI toan frontend theo uu tien:

1. Mobile
2. Tablet
3. Web

Muc tieu la thao tac nhanh, de hoc, de mo rong cho nghiep vu kho va ban hang.

## 1. Design Principles

1. Mobile first, khong web thu nho.
2. Tac vu truoc, trang tri sau.
3. Mot mau hinh phai ro 1 muc dich chinh.
4. Giam so lan cham de hoan thanh nghiep vu.
5. Nhat quan token mau, spacing, typography, bo goc.

## 2. Breakpoints va Layout Rules

- `mobile`: < 768
- `tablet`: 768 - 1199
- `web`: >= 1200

### 2.1 Mobile

- Dieu huong chinh: bottom tabs (4-5 muc).
- Drawer chi dung cho menu phu va tai khoan.
- Danh sach hien thi dang card, uu tien 3-4 thong tin quan trong.
- Action quan trong dat o sticky bottom bar.

### 2.2 Tablet

- Dieu huong chinh: navigation rail ben trai + stack noi dung.
- Ho tro split view list/detail neu nghiep vu phu hop.
- Form lon chia 2 cot nhung van giu thu tu thao tac tu tren xuong.

### 2.3 Web

- Sidebar co dinh ben trai + top command bar.
- Bang du lieu day du cot, co bo loc mo rong.
- Cho phep panel phu ben phai cho preview/detail.

## 3. Visual Direction

Chu de de xuat: "Field Ops Console"

- Primary: xanh nong nghiep
- Secondary: amber cho canh bao nghiep vu
- Neutral: slate cho nen va text
- Success/Error/Info theo semantic token

Phong cach:

- Mat do thong tin cao nhung de doc
- Contrast ro tren mobile ngoai troi
- Icon va badge nhan nghiep vu (trang thai, ton kho, thanh toan)

## 4. Design Tokens (Dung chung)

Can chuan hoa token trong `src/utils/theme.ts` va khong hard-code mau trong screen.

### 4.1 Colors

- `primary`, `primaryLight`, `primaryForeground`
- `secondary`, `secondaryForeground`
- `background`, `surface`, `surfaceRaised`
- `foreground`, `mutedForeground`
- `border`, `input`, `ring`
- `success`, `warning`, `error`, `info`

### 4.2 Spacing

- Scale 4-8-12-16-20-24-32-40-48
- Margin/padding theo boi so 4

### 4.3 Radius

- `sm` = 6
- `md` = 10
- `lg` = 14
- `xl` = 20
- `pill` = 999

### 4.4 Typography

- `h1`, `h2`, `h3`, `title`, `body`, `label`, `caption`
- Chieu cao dong va weight co quy tac ro rang

## 5. Navigation Architecture

## 5.1 Main IA

- Tong quan
- Ban hang
- Ton kho
- Chung tu
- Cau hinh

## 5.2 Mobile Navigation

- Bottom tabs:
    - Tong quan
    - POS
    - Ton kho
    - Chung tu
    - Them (More)
- Trong tab "Them" moi vao danh sach cau hinh/master data.

## 5.3 Tablet/Web Navigation

- Sidebar theo nhom nghiep vu
- Co quick action zone phia tren (VD: Tao don, Tao phieu nhap)

## 6. Screen Templates

## 6.1 List Template

Thanh phan mac dinh:

1. Header: title + subtitle + action chinh
2. Search bar
3. Filter chips (trang thai, kho, thoi gian)
4. Content list
5. Empty/Error/Loading state

Hanh vi theo breakpoint:

- Mobile: card list
- Tablet: compact table/card lai
- Web: full table + sticky header

## 6.2 Detail Template

1. Summary card
2. Group thong tin theo section
3. Timeline/lich su (neu co)
4. Primary + Secondary actions

## 6.3 Form Template

1. Form section ro rang (Thong tin chung, Hang hoa, Thanh toan...)
2. Validation message sat field
3. Sticky action bar tren mobile

## 6.4 POS Template

- Mobile:
    - Tab con: San pham / Gio hang
    - Footer sticky: Tong tien + nut Thanh toan
- Tablet/Web:
    - 2 cot co dinh: Product list ben trai, Cart ben phai
    - Cart co tong ket tai cho, khong phai cuon sau

## 7. UX Rules Theo Ngu Canh

## 7.1 Empty, Loading, Error

- Empty state co text huong dan hanh dong tiep theo
- Skeleton hoac loading spinner nhat quan
- Error co nut "Thu lai"

## 7.2 Search va Filter

- Search debounce
- Filter chips de xoa nhanh
- Luu bo loc gan nhat theo man hinh

## 7.3 Accessibility

- Kich thuoc touch target >= 44px
- Contrast dat muc doc ngoai troi
- Label ro cho icon-only buttons

## 8. Uu Tien Refactor UI

Phase UI-1 (Nen tang)

1. Chuan hoa breakpoints + responsive hook
2. Chuan hoa theme tokens
3. Tao bo component dung chung (`ScreenHeader`, `SearchBar`, `FilterChips`, `EmptyState`)

Phase UI-2 (Dieu huong)

1. Chuyen sang bottom tabs cho mobile
2. Drawer thanh menu phu
3. Tablet/Web dung sidebar/rail on dinh

Phase UI-3 (Man hinh trong tam)

1. HomeScreen
2. DataTableScreen
3. PosScreen
4. InventoryStockScreen

Phase UI-4 (Nhan rong)

1. Toan bo cac list screen con lai
2. Chuan hoa status badge va dinh dang so tien

## 9. Definition Of Done (UI)

Mot man hinh duoc xem la dat chuan UI v1 khi:

1. Dung dung template cho loai man hinh
2. Khong hard-code mau/chu dao khong qua token
3. Hanh vi dung tren mobile, tablet, web
4. Co empty/loading/error state
5. Action chinh luon de thay de cham tren mobile

## 10. Checklist Trien Khai Ky Thuat

1. Tao `src/utils/responsive.ts` cho breakpoint helper.
2. Mo rong `src/utils/theme.ts` theo token moi.
3. Refactor `MainDrawerNavigator` thanh mo hinh mobile-first.
4. Refactor `DataTableScreen` theo card/table template moi.
5. Refactor `HomeScreen`, `PosScreen`, `InventoryStockScreen`.
6. Quet toan bo screens de loai hard-code style bat nhat.
