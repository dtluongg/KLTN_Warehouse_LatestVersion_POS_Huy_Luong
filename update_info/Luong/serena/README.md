# Warehouse Management + POS System (KLTN)

**Stack:** Spring Boot 3.x + React Native/TypeScript + PostgreSQL + PayOS  
**Architecture:** Microservices (monolithic backend + mobile-first frontend)  
**MVP Status:** Core features complete (Auth, POS, Inventory, Goods Receipt, Reports)

---

## 🏗️ Project Structure

### **Backend** (`backend/src/main/java/IUH/KLTN/LvsH/`)

```
├── BackendRefactorApplication.java          # Entry point, Spring Boot main
├── config/
│   └── PayOSConfig.java                     # Payment integration config
├── controller/                              # 16 REST API endpoints
│   ├── OrderController.java                 # Orders, payment preview
│   ├── PaymentController.java               # QR codes, PayOS webhooks
│   ├── GoodsReceiptController.java          # Goods receipt workflow
│   ├── PurchaseOrderController.java         # PO management
│   ├── ProductController.java               # Product catalog & stock by warehouse
│   ├── InventoryMovementController.java     # Stock history & tracking
│   ├── StockAdjustmentController.java       # Manual inventory adjustments
│   ├── CustomerReturnController.java        # Customer returns
│   ├── SupplierReturnController.java        # Supplier returns
│   ├── AuthController.java                  # Login/logout + JWT
│   ├── CouponController.java                # Coupon CRUD & validation
│   ├── WarehouseController.java             # Warehouse configuration
│   ├── CustomerController.java              # Customer master data
│   ├── SupplierController.java              # Supplier master data
│   ├── CategoryController.java              # Product categories
│   ├── StaffController.java                 # Staff management
│   ├── ReportController.java                # Analytics & statistics
│   └── AiSqlChatController.java             # AI-powered SQL queries
├── service/                                 # 18 business logic services
│   ├── OrderService.java                    # Order creation, payment methods, coupons
│   ├── PaymentService.java                  # PayOS integration, QR generation
│   ├── GoodsReceiptService.java             # Receipt workflow (create → complete)
│   ├── InventoryMovementService.java        # Auto-generated movement records
│   ├── StockAdjustmentService.java          # Manual stock adjustments
│   ├── ProductService.java                  # Product queries with warehouse stock
│   ├── ReportService.java                   # Report generation (10+ report types)
│   ├── CouponService.java                   # Coupon validation & preview
│   ├── CustomerReturnService.java           # Customer return handling
│   ├── SupplierReturnService.java           # Supplier return handling
│   ├── [CustomerService, SupplierService, CategoryService, ...]
│   └── ai/
│       └── SqlSafetyValidator.java          # SQL injection prevention
├── entity/                                  # 20 JPA entities
│   ├── Order.java                           # POS orders (DRAFT/POSTED/CANCELLED)
│   ├── GoodsReceipt.java                    # Goods receipt from suppliers
│   ├── PurchaseOrder.java                   # Purchase orders to suppliers
│   ├── InventoryMovement.java               # Stock movement ledger
│   ├── StockAdjustment.java                 # Manual adjustments
│   ├── Product.java                         # Product master
│   ├── Warehouse.java                       # Warehouse master
│   ├── Customer.java                        # Customer master
│   ├── Supplier.java                        # Supplier master
│   └── [CustomerReturn, SupplierReturn, Category, Coupon, Staff...]
├── dto/                                     # Request/Response objects
│   ├── order/                               # OrderRequestDTO, OrderDetailResponseDTO
│   ├── goods_receipt/                       # GoodsReceiptRequestDTO, DetailResponseDTO
│   ├── payment/                             # CreatePaymentLinkResponseDTO (PayOS)
│   ├── AuthRequestDTO, AuthResponseDTO      # Login request/response + JWT
│   ├── CouponPreviewResponseDTO             # Coupon validation response
│   └── [ReportDTOs, CategoryDTOs, ...]
├── enums/                                   # 7 domain enums
│   ├── PaymentMethod.java                   # CASH, TRANSFER, MIX, DEBT, CARD
│   ├── DocumentStatus.java                  # DRAFT, POSTED, CANCELLED
│   ├── InventoryMovementType.java           # PURCHASE_IN, SALE_OUT, ADJUST_IN/OUT, etc.
│   ├── SalesChannel.java                    # POS, ONLINE
│   └── [PurchaseOrderReceiptProgress, ...]
├── repository/                              # 18 Spring Data repositories
│   ├── OrderRepository.java
│   ├── InventoryMovementRepository.java
│   ├── ProductRepository.java
│   └── [GoodsReceiptRepository, CustomerRepository, ...]
├── security/
│   ├── JwtTokenProvider.java                # JWT token generation & validation
│   ├── JwtAuthenticationFilter.java         # JWT token verification filter
│   └── SecurityConfig.java                  # Spring Security configuration
└── exception/
    └── GlobalExceptionHandler.java          # Centralized error handling

**Database:** Flyway migrations (`backend/src/resources/db/migration/`)
- V1-V21: Schema creation (master tables, documents, inventory)
- V15+: Financial adjustments, payment fields, supplier products, auto-generated codes
```

### **Frontend** (`frontend/src/`)

```
├── api/                                     # Axios clients for backend communication
│   ├── axiosClient.ts                       # Base config + JWT interceptor + 401 handler
│   ├── authApi.ts                           # POST /api/auth/login
│   ├── paymentApi.ts                        # QR creation & payment status check
│   ├── reportApi.ts                         # Report generation endpoints
│   ├── aiSqlChatApi.ts                      # AI SQL chat
│   └── [supplierProductApi.ts, supabaseStorage.ts]
├── store/                                   # Zustand global state
│   ├── authStore.ts                         # token, username, role, JWT handling
│   ├── posStore.ts                          # cart[], customerId, couponCode, paymentMethod
│   └── themeStore.ts                        # light/dark theme mode
├── navigation/
│   ├── AppNavigator.tsx                     # Root: Auth stack → MainDrawer/MobileTab
│   ├── MainDrawerNavigator.tsx              # Desktop/tablet drawer navigation (20 features)
│   └── MobileTabNavigator.tsx               # Mobile bottom tab navigation
├── features/                                # 20 feature modules (1 module = 1+ screens)
│   ├── auth/screens/
│   │   └── LoginScreen.tsx                  # JWT login form
│   ├── overview/screens/
│   │   └── HomeScreen.tsx                   # Dashboard + quick actions
│   ├── pos/
│   │   ├── screens/
│   │   │   └── PosScreen.tsx                # Core POS interface (select warehouse → add products → checkout)
│   │   ├── components/
│   │   │   ├── ProductGrid.tsx              # Product display with category filters
│   │   │   ├── CartSummary.tsx              # Cart + coupon validation + payment method
│   │   │   └── QRPaymentModal.tsx           # QR payment (120 sec countdown)
│   │   └── utils/
│   │       └── calTimeLeft.ts               # QR expiration timer
│   ├── orders/screens/
│   │   └── OrderListScreen.tsx              # Order history + search
│   ├── inventory-stock/screens/
│   │   └── InventoryStockScreen.tsx         # Current stock by warehouse
│   ├── goods-receipts/screens/
│   │   ├── GoodsReceiptScreen.tsx           # List + create + detail
│   │   └── GoodsReceiptFormScreen.tsx       # Create/edit goods receipt
│   ├── purchase-orders/screens/             # PO management (create, approve, receive)
│   ├── stock-adjustments/screens/           # Manual inventory adjustments
│   ├── customer-returns/screens/            # Track customer returns
│   ├── supplier-returns/screens/            # Track supplier returns
│   ├── customers/screens/                   # Customer CRUD
│   ├── suppliers/screens/                   # Supplier CRUD
│   ├── products/screens/                    # Product CRUD + search
│   ├── categories/screens/                  # Category CRUD
│   ├── coupons/screens/                     # Coupon CRUD + validation
│   ├── warehouses/screens/                  # Warehouse configuration
│   ├── staff/screens/                       # Staff management
│   ├── inventory-movements/screens/         # Movement history/ledger
│   ├── reports/screens/
│   │   └── WarehouseStatisticsScreen.tsx    # 10+ report types (revenue, stock coverage, etc.)
│   ├── ai-sql-chat/screens/
│   │   └── AiSqlChatScreen.tsx              # Natural language queries
│   └── settings/screens/
│       └── MoreMenuScreen.tsx               # User menu + logout
├── components/                              # Reusable UI components
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ScreenHeader.tsx                 # Standard header with title/subtitle
│   │   ├── EmptyState.tsx
│   │   └── Typography.tsx
│   ├── CustomDrawerContent.tsx              # Custom drawer layout
│   └── DataTableScreen.tsx                  # Generic data table with pagination
├── hooks/
│   ├── useTablePagination.ts                # Pagination logic hook
│   └── useTheme.ts                          # Theme context hook
├── theme/                                   # Apple-inspired design system
│   ├── colors.ts                            # Dark/light theme colors (binary light/dark + Apple Blue accent)
│   ├── typography.ts                        # SF Pro font sizes & weights
│   ├── metrics.ts                           # Spacing, margins, padding
│   └── index.ts                             # Theme exports
├── types/
│   └── index.ts                             # TypeScript interfaces (AuthResponse, CartItem, etc.)
├── utils/
│   ├── responsive.ts                        # Breakpoint detection (mobile <1024px)
│   ├── roleAccess.ts                        # Role-based screen access
│   ├── storage.ts                           # AsyncStorage wrapper (JWT token, preferences)
│   └── theme.ts                             # Theme utilities
└── App.tsx                                  # Root component

**Frontend Stack:**
- React Native + Expo (web, iOS, Android support)
- TypeScript for type safety
- Zustand for state management
- Axios for HTTP client
- React Navigation for routing
- Responsive design (mobile-first approach)
```

---

## 🔄 Main Workflows

### **1. Authentication Flow**
```
User → LoginScreen 
  ↓ credentials (username/password)
Backend: POST /api/auth/login
  ↓ validate + JWT generation
Response: { accessToken, refreshToken, tokenType, username, role }
  ↓
authStore.login() → store accessToken + refreshToken securely
  ↓
Navigate to MainDrawer/MobileTab (role-based)
```

### **2. POS Order Flow** (Main revenue feature)
```
PosScreen → 
1. Select warehouse (required)
2. GET /api/products/stock-by-warehouse → Display products
3. Category filter + search for products
4. Add items to cart (posStore.addToCart)
5. Select customer (optional, for invoicing)
6. Apply coupon → GET /api/orders/preview-coupon → Validate discount
7. Select payment method:
   - CASH/DEBT/CARD → Direct order
   - TRANSFER → Generate QR code
8. Create Order → POST /api/orders
   ↓
   If TRANSFER:
     → POST /api/payments/create-qr/{orderId} → PayOS QR generation
     → Show QRPaymentModal (120 sec timeout)
     → Poll GET /api/payments/check/{orderId}
     → On PAID → Complete order
   Else:
     → Order completed immediately
   ↓
9. Clear cart, refresh products, show order confirmation
```

### **3. Goods Receipt Workflow** (Warehouse operation)
```
GoodsReceiptScreen (List) →
1. Create New Goods Receipt → GoodsReceiptFormScreen
   - Select Purchase Order (or manual entry)
   - Select products from PO
   - Input received quantities
   - Select warehouse for storage
2. POST /api/goods-receipts → Save as DRAFT
3. Edit/Review goods receipt
4. POST /api/goods-receipts/{id}/complete
   - Validates receipt completeness
   - Creates InventoryMovement records (PURCHASE_IN)
   - Updates Product stock in warehouse
5. Option to cancel goods receipt
```

### **4. Inventory Management Flow**
```
InventoryStockScreen:
  - GET /api/products/stock-by-warehouse
  - Display: Product name, SKU, onHand qty per warehouse
  
StockAdjustmentScreen:
  - Create manual adjustment (ADJUST_IN or ADJUST_OUT)
  - POST /api/stock-adjustments
  - POST /api/stock-adjustments/{id}/complete
  - Creates InventoryMovement record (ADJUST_IN/ADJUST_OUT)
  - Updates product stock

InventoryMovementController:
  - GET /api/inventory-movements → View movement history
  - All movements auto-created by system
```

### **5. Payment Flow** (QR Code Integration)
```
Order created with TRANSFER method →
POST /api/payments/create-qr/{orderId}
  ↓
PayOS API generates:
  - orderCode
  - qrCode (image)
  - checkoutUrl
  - expireDate (120 seconds)
  ↓
Frontend: Show QRPaymentModal
  - Display QR image
  - Start countdown timer
  - Poll GET /api/payments/check/{orderId} every 2 seconds
  ↓
PayOS webhook notifies backend on payment completion
  ↓
Order status updated to POSTED (payment confirmed)
```

### **6. Report Generation Flow**
```
WarehouseStatisticsScreen → Select filters (warehouse, date range)
  ↓
GET /api/reports/{reportType}?warehouseId=X&fromDate=Y&toDate=Z
  ↓
Backend ReportService generates:
  - CurrentInventoryReportDTO (stock snapshot)
  - DailyRevenueProfitReportDTO (revenue, profit analysis)
  - TopSellingProductReportDTO (bestsellers)
  - DaysOfCoverageReportDTO (stock coverage days)
  - StockAdjustmentSummaryReportDTO (adjustment history)
  - InventoryValueReportDTO (stock monetary value)
  - StockoutRiskReportDTO (products at risk)
  - SlowMovingProductReportDTO (inactive products)
  ↓
Frontend: Display in charts/tables
```

### **7. AI SQL Chat Flow**
```
AiSqlChatScreen → User enters natural language query
  ↓
POST /api/ai/chat { question: "..." }
  ↓
Backend:
  - SqlSafetyValidator checks query safety (prevent SQL injection)
  - Convert natural language → SQL
  - Execute query
  - Format results
  ↓
AiSqlChatResponseDTO { result, formatted_text }
```

---

## 📊 Key Enums & Statuses

### **PaymentMethod**
- `CASH` - Cash payment, auto-complete
- `TRANSFER` - Bank transfer + QR code
- `MIX` - Combination of payment methods
- `DEBT` - Defer payment (credit)
- `CARD` - Credit/debit card

### **DocumentStatus**
- `DRAFT` - Saved but not finalized
- `POSTED` - Finalized & locked
- `CANCELLED` - Voided/canceled

### **InventoryMovementType**
- `PURCHASE_IN` - Goods received from supplier
- `SALE_OUT` - Products sold (POS order)
- `RETURN_IN` - Customer returns
- `RETURN_OUT` - Return to supplier
- `ADJUST_IN/OUT` - Manual stock adjustments
- `TRANSFER_IN/OUT` - Warehouse transfer
- `CONVERSION_IN/OUT` - Product conversion/bundling

### **Role-Based Access**
- `ADMIN` - Full system access
- `SALES_STAFF` - POS, orders, customers, reports
- `WAREHOUSE_STAFF` - Inventory, goods receipt, stock adjustment

---

## 🔌 Key API Endpoints

| Feature | Method | Endpoint | Auth |
|---------|--------|----------|------|
| Login | POST | `/api/auth/login` | No |
| Refresh Access Token | POST | `/api/auth/refresh` | No |
| Logout | POST | `/api/auth/logout` | Yes/Refresh token |
| Create Order | POST | `/api/orders` | Yes |
| List Orders | GET | `/api/orders?page=0&size=20` | Yes |
| Preview Coupon | POST | `/api/orders/preview-coupon?code=X&amount=Y` | Yes |
| Create Payment QR | POST | `/api/payments/create-qr/{orderId}` | Yes |
| Check Payment | GET | `/api/payments/check/{orderId}` | Yes |
| Create Goods Receipt | POST | `/api/goods-receipts` | Yes |
| Complete GR | POST | `/api/goods-receipts/{id}/complete` | Yes |
| Get Stock by Warehouse | GET | `/api/products/stock-by-warehouse?warehouseId=1` | Yes |
| List Products | GET | `/api/products?page=0&size=50` | Yes |
| Create Stock Adjustment | POST | `/api/stock-adjustments` | Yes |
| Complete Adjustment | POST | `/api/stock-adjustments/{id}/complete` | Yes |
| Get Reports | GET | `/api/reports/{type}?warehouseId=1&fromDate=X&toDate=Y` | Yes |
| AI Chat | POST | `/api/ai/chat` | Yes |

---

## 🗄️ Database Schema Highlights

**Master Tables:**
- `customers` - Customer records
- `suppliers` - Supplier records
- `products` - Product master data
- `categories` - Product categories
- `warehouses` - Warehouse locations
- `staff` - Employee records

**Document Tables (with DocumentStatus):**
- `orders` - POS orders
- `purchase_orders` - Supplier purchase orders
- `goods_receipts` - Goods received from suppliers
- `customer_returns` - Returns from customers
- `supplier_returns` - Returns to suppliers
- `stock_adjustments` - Manual inventory adjustments

**Transaction Tables:**
- `inventory_movements` - Stock movement ledger (audit trail)

**Config Tables:**
- `coupons` - Discount codes

**Flyway Migrations:** V1-V21 handle schema evolution

---

## 🚀 Quick Start for AI Agents

### **Understanding the Codebase:**

1. **Entry Points:**
   - Backend: `BackendRefactorApplication.java` (port 9999)
   - Frontend: `App.tsx` → `AppNavigator.tsx` → Authentication → MainDrawer/MobileTab

2. **Request/Response Pattern:**
   - Frontend: Build DTO → POST/GET to backend → Store response in Zustand
   - Backend: Validate DTO → Business logic in Service → Return ResponseDTO

3. **Key Business Logic:**
   - Orders: `OrderService.createOrder()` → validates customer, applies coupon, creates payment
   - Inventory: Auto-tracked via `InventoryMovement` on every document completion
   - Reports: Generated via `ReportService` from `InventoryMovement` ledger

4. **Authentication:**
   - All requests (except `/auth/login`) require JWT Bearer token
   - Token stored in `authStore.ts` (frontend) + local storage
   - Interceptor: `axiosClient.ts` adds Bearer token to every request

5. **Common Patterns:**
   - **Search/Filter:** `SearchCriteria` DTO + pagination (`Pageable`)
   - **Document Workflow:** DRAFT → POSTED → CANCELLED (with status validation)
   - **Stock Tracking:** Every document completion auto-creates `InventoryMovement` record
   - **Error Handling:** `GlobalExceptionHandler` (backend) + 401 auto-logout (frontend)

### **For Adding Features:**

1. **Backend:** Add Controller → Service → Repository → DTO → Entity
2. **Frontend:** Add Feature module → Screen → API call in component → Zustand store update
3. **Database:** Create Flyway migration if schema changes needed

### **Most Important Files to Understand First:**

**Backend:**
- `OrderService.createOrder()` - Core POS logic
- `PaymentService` - Payment integration
- `InventoryMovementService` - Stock tracking
- `ReportService` - Analytics

**Frontend:**
- `PosScreen.tsx` - Main revenue feature
- `posStore.ts` - Cart management + coupon validation
- `axiosClient.ts` - API configuration
- `authStore.ts` - Authentication state

---

## 📝 Notes

- **Database:** PostgreSQL with Flyway migrations
- **API Base URL:** `http://localhost:9999/api` (local dev)
- **Frontend Base URL:** `http://10.0.2.2:9999/api` (Android emulator) / `localhost` (web)
- **JWT Token:** Stored in local storage, auto-attached to all requests
- **JWT Token:** Access token sống ngắn hạn, refresh token dùng để cấp lại access token khi hết hạn
- **JWT Timing:** Access token 15 phút, refresh token 7 ngày
- **Payment Gateway:** PayOS (QR code generation + webhook handling)
- **Responsive Design:** Mobile-first (mobile <1024px, tablet/desktop ≥1024px)
- **Type Safety:** Full TypeScript + Spring Boot type annotations

---

**Last Updated:** May 2, 2026  
**MVP Scope:** Core warehouse + POS operations complete. Phase 2: Advanced reports, multi-branch, accounting integration.
