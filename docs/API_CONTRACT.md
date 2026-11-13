# API_CONTRACT - Hợp đồng API giữa Backend và Frontend

> Đối chiếu giao tiếp giữa `backend/src/routes` và `frontend/src/api`.
> Đối chiếu: [ARCHITECTURE.md](./ARCHITECTURE.md), [ROLE_MATRIX.md](./ROLE_MATRIX.md), [SCREEN_INVENTORY.md](./SCREEN_INVENTORY.md), [ERD.md](./ERD.md).

---

## 1. Quy ước chung

| Hạng mục | Quy ước |
| :-- | :-- |
| Base URL | `http://localhost:4000/api` |
| Định dạng | `Content-Type: application/json; charset=utf-8` |
| Tên trường JSON | **camelCase** (backend tự chuyển từ `snake_case` của DB) |
| ID | `number` (số nguyên dương) |
| Tiền tệ | `number`, đơn vị VND (DECIMAL(15,2) trả về dạng số) |
| Ngày giờ | Chuỗi ISO 8601: `DATETIME` → `"2026-10-26T08:30:00Z"`, `DATE` → `"2026-11-15"` |
| Thành công | Luôn bọc `{ "data": ... }` |
| Danh sách có phân trang | `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }` |
| Query phân trang | `page` (mặc định 1), `limit` (mặc định 12, tối đa 100) |
| Lỗi | Luôn bọc `{ "error": { "code", "message", "details"? } }` |

### 1.1 Kí hiệu quyền truy cập

| Kí hiệu | Ý nghĩa |
| :-- | :-- |
| `Public` | Không cần token |
| `Guest` | Chỉ dành cho người chưa đăng nhập |
| `Auth` | Cần JWT hợp lệ, mọi role |
| `customer` / `sales` / `admin` | Cần JWT và role tương ứng (middleware `authorize`) |
| `R1`…`R14` | Quy tắc row-level trong [ROLE_MATRIX.md §4](./ROLE_MATRIX.md) |

---

## 2. Xác thực & phân quyền

- Header: `Authorization: Bearer <accessToken>`
- JWT payload: `{ "sub": <userId>, "role": "customer|sales|admin", "customerId"?: <number>, "iat", "exp" }`
- Hạn token: 2 giờ (`JWT_EXPIRES_IN=2h`). Hết hạn → `401 TOKEN_EXPIRED`, frontend xoá token và chuyển `/login`.
- `POST /api/auth/logout` trả xác nhận. Frontend xóa token lưu cục bộ.
- `ProtectedRoute` ở frontend chỉ phục vụ trải nghiệm; bảo mật thực sự nằm ở backend.

---

## 3. Error Handling chung

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [{ "field": "email", "message": "Email không đúng định dạng" }]
  }
}
```

### 3.1 Danh mục mã lỗi

| HTTP | `code` | Khi nào |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | Body/query/params sai Zod schema (`details` liệt kê từng trường) |
| 401 | `UNAUTHORIZED` | Thiếu token |
| 401 | `INVALID_TOKEN` | Token sai hoặc tài khoản bị khóa |
| 401 | `TOKEN_EXPIRED` | Token hết hạn |
| 401 | `INVALID_CREDENTIALS` | Sai email, mật khẩu hoặc tài khoản inactive |
| 403 | `FORBIDDEN` | Sai role hoặc vi phạm row-level (không phải chủ dữ liệu) |
| 404 | `NOT_FOUND` | Tài nguyên không tồn tại (hoặc bị ẩn do row-level) |
| 409 | `DUPLICATE_EMAIL` | Email đã đăng ký |
| 409 | `DUPLICATE_ENTRY` | Trùng giá trị UNIQUE (SKU, slug, tên brand/material/tier) |
| 409 | `OUT_OF_STOCK` | Không đủ tồn kho khả dụng |
| 409 | `VERSION_CONFLICT` | Restock dùng `inventory.version` đã cũ (optimistic locking) |
| 409 | `EDITION_SOLD_OUT` | Không còn bản Limited Edition `available` |
| 409 | `INVALID_STATUS_TRANSITION` | Chuyển trạng thái đơn/khoản thu không hợp lệ |
| 409 | `ALREADY_CLAIMED` | Đơn đã có Sales khác nhận |
| 409 | `ALREADY_PAID` | Khoản thanh toán không còn ở trạng thái chờ |
| 409 | `DUPLICATE_REVIEW` | `order_item` đã được đánh giá (R4) |
| 409 | `NOT_ELIGIBLE_FOR_REVIEW` | Đơn chưa `delivered` hoặc không thuộc khách (R3) |
| 409 | `RESOURCE_IN_USE` | Xoá bản ghi đang được tham chiếu (biến thể đã bán R11, brand còn sản phẩm…) |
| 429 | `RATE_LIMITED` | Vượt giới hạn gọi `/api/auth/*` |
| 500 | `INTERNAL_ERROR` | Lỗi không mong đợi (không lộ chi tiết SQL) |

Mọi endpoint yêu cầu token đều có thể trả `401 UNAUTHORIZED / TOKEN_EXPIRED`; mọi endpoint có role đều có thể trả `403 FORBIDDEN`; mọi endpoint có body/query đều có thể trả `400 VALIDATION_ERROR`. Các bảng lỗi bên dưới chỉ liệt kê thêm lỗi **đặc thù**.

---

## 4. Shared Models (kiểu dữ liệu dùng chung)

> Được hiện thực tại `backend/src/types/index.ts` và `frontend/src/types/index.ts`.

```ts
type UserRole = "customer" | "sales" | "admin";
type OrderStatus = "pending" | "confirmed" | "in_production" | "shipped" | "delivered" | "cancelled";
type PaymentType = "deposit" | "installment" | "final";
type PaymentStatus = "pending" | "paid" | "overdue" | "refunded";
type VariantStatus = "active" | "discontinued";
type MaterialType = "wood" | "leather" | "stone" | "metal" | "fabric" | "glass";
type LocationType = "showroom" | "warehouse";

interface Tier { id: number; name: string; minSpent: number; discountPct: number; }

interface AuthUser {
  id: number; email: string; fullName: string; role: UserRole;
  customer?: { id: number; phone: string | null; address: string | null; city: string | null;
               totalSpent: number; tier: Tier; nextTier: Tier | null; };
}

interface Brand { id: number; name: string; country: string | null; foundedYear: number | null; }
interface Category { id: number; parentId: number | null; name: string; slug: string; }
interface Material { id: number; name: string; type: MaterialType; origin: string | null; }
interface Location { id: number; name: string; type: LocationType; city: string | null; }

interface ProductSummary {
  id: number; name: string; collectionName: string | null; designerName: string | null;
  isLimited: boolean; isMadeToOrder: boolean;
  brand: { id: number; name: string }; category: { id: number; name: string };
  minPrice: number; avgRating: number | null; reviewCount: number;
}

interface VariantMaterial { materialId: number; name: string; type: MaterialType; portion: number | null; finishNote: string | null; }

interface StockByLocation {
  locationId: number; locationName: string; locationType: LocationType;
  available: number | null;   // Guest: null
  inStock: boolean;           // Guest chỉ thấy cờ này (ROLE_MATRIX FR4)
}

interface Variant {
  id: number; sku: string; size: string | null; finish: string | null;
  price: number; leadTimeDays: number; status: VariantStatus;
  materials: VariantMaterial[]; stock: StockByLocation[];
  edition?: { total: number; available: number };   // chỉ khi product.isLimited
}

interface Review { id: number; rating: number; comment: string | null; customerName: string; createdAt: string; }

interface ProductDetail extends Omit<ProductSummary, "minPrice"> {
  description: string | null; variants: Variant[]; reviews: Review[];
}

interface OrderItem {
  id: number; variantId: number; sku: string; productId: number; productName: string;
  locationId: number; locationName: string; quantity: number; unitPrice: number;
  customization: Record<string, unknown> | null;
  serialNo: string | null;      // bản Limited Edition được cấp
  reviewId: number | null;      // đã đánh giá hay chưa
}

interface Payment {
  id: number; orderId: number; type: PaymentType; amount: number;
  dueDate: string | null; paidAt: string | null; method: string | null; status: PaymentStatus;
}

interface OrderSummary {
  id: number; orderDate: string; status: OrderStatus; total: number;
  itemCount: number; customerName: string; salesUserId: number | null;
}

interface OrderDetail {
  id: number; orderDate: string; status: OrderStatus;
  subtotal: number; discount: number; total: number;
  shippingAddress: string; deliveryDate: string | null;
  customer: { id: number; fullName: string; email: string; phone: string | null; tierName: string };
  salesUser: { id: number; fullName: string } | null;
  items: OrderItem[]; payments: Payment[];
}

interface PageMeta { page: number; limit: number; total: number; totalPages: number; }
```

---

## 5. Danh sách endpoint tổng hợp

| # | Method | Endpoint | FR | Quyền | Màn hình |
| :-: | :-- | :-- | :-- | :-- | :-- |
| 1 | POST | `/api/auth/register` | FR1 | Guest | P05 |
| 2 | POST | `/api/auth/login` | FR0 | Guest | P04 |
| 3 | GET | `/api/catalog/meta` | FR2, FR3 | Public | P01, P02, S05, A05–A07 |
| 4 | GET | `/api/products` | FR2, FR3 | Public | P01, P02, A05 |
| 5 | GET | `/api/products/:id` | FR4, FR6, FR10 | Public | P03, C01, C03, A06 |
| 6 | POST | `/api/orders` | FR5, FR6 | customer | C02, C03 |
| 7 | GET | `/api/orders` | FR8 | customer | C04 |
| 8 | GET | `/api/orders/:id` | FR7, FR8 | customer | C04 |
| 9 | POST | `/api/orders/:id/cancel` | FR9 | customer | C04 |
| 10 | POST | `/api/orders/:id/payments` | FR7b | sales | S04 |
| 11 | POST | `/api/payments/:id/pay` | FR7 | customer | C04 |
| 12 | POST | `/api/reviews` | FR10 | customer | C07 |
| 13 | DELETE | `/api/reviews/:id` | FR10 | customer, admin | C07, A10 |
| 14 | PATCH | `/api/sales/orders/:id/claim` | FR11 | sales | S02 |
| 15 | PATCH | `/api/sales/orders/:id/status` | FR11 | sales | S03 |
| 16 | GET | `/api/sales/inventory` | FR12 | sales, admin | S01, S05, S06 |
| 17 | PATCH | `/api/sales/inventory/restock` | FR12 | sales | S06 |
| 18 | GET | `/api/sales/receivables` | FR13 | sales, admin | S01, S07 |
| 19 | POST | `/api/sales/receivables/mark-overdue` | FR13 | sales | S07 |
| 20 | POST | `/api/admin/products` | FR14 | admin | A05 |
| 21 | PATCH | `/api/admin/products/:id` | FR14 | admin | A05 |
| 22 | DELETE | `/api/admin/products/:id` | FR14 | admin | A05 |
| 23 | POST | `/api/admin/products/:id/variants` | FR14 | admin | A06 |
| 24 | PATCH | `/api/admin/variants/:id` | FR14 | admin | A06 |
| 25 | DELETE | `/api/admin/variants/:id` | FR14 | admin | A06 |
| 26 | POST | `/api/admin/:resource` | FR14 | admin | A07 |
| 27 | PATCH | `/api/admin/:resource/:id` | FR14 | admin | A07 |
| 28 | DELETE | `/api/admin/:resource/:id` | FR14 | admin | A07 |
| 29 | GET | `/api/admin/reports/:type` | FR15a | admin | A01–A04 |
| 30 | GET | `/api/admin/tiers` | FR15b | admin | A08 |
| 31 | PATCH | `/api/admin/tiers/:id` | FR15b | admin | A08 |
| 32 | POST | `/api/admin/tiers/recalculate` | FR15b | admin | A08 |
| 33 | GET/PATCH | `/api/auth/me` | — | Auth | C02, C08 |
| 34 | GET/POST | `/api/admin/users` | A09 | admin | A09 |
| 35 | PATCH | `/api/admin/users/:id/status` | A09 | admin | A09 |
| 36 | GET | `/api/admin/reviews` | FR10 | admin | A10 |

---

## 6. Đặc tả chi tiết

### 6.1 Nhóm Auth

#### [1] Đăng ký tài khoản khách hàng

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/auth/register` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | Guest · Rate limit · R13: luôn tạo `role = customer`, bỏ qua `role` client gửi · Gán hạng có `minSpent` thấp nhất |
| **Request Params & Headers** | `Content-Type: application/json` |

**Request Body**
```json
{
  "fullName": "Nguyễn Văn A",        // string, 2–120, bắt buộc
  "email": "a@example.com",          // email, ≤150, bắt buộc
  "password": "Secret@123",          // string, 8–72, bắt buộc
  "phone": "0901234567",             // string ≤20, tuỳ chọn
  "address": "12 Lê Lợi, Q.1",       // string ≤255, tuỳ chọn
  "city": "TP.HCM"                   // string ≤80, tuỳ chọn
}
```

**Responses**

| Status | Body |
| :-: | :-- |
| `201` | `{ "data": { "accessToken": "eyJ...", "user": AuthUser } }` |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | Thiếu/sai định dạng trường |
| 409 | `DUPLICATE_EMAIL` | Email đã tồn tại (`uq_users_email`) |
| 429 | `RATE_LIMITED` | Gọi quá nhiều lần |

---

#### [2] Đăng nhập

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/auth/login` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | Guest · Rate limit |
| **Request Params & Headers** | `Content-Type: application/json` |

**Request Body**
```json
{ "email": "customer.silver@gmail.com", "password": "password123" }
```

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "accessToken": "eyJ...", "expiresIn": 7200, "user": AuthUser } }` — `user.customer` chỉ có khi `role = customer` |

Frontend điều hướng theo `user.role`: `customer` → `/account/orders`, `sales` → `/sales`, `admin` → `/admin`.

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 401 | `INVALID_CREDENTIALS` | Sai email, mật khẩu hoặc tài khoản inactive (không phân biệt trường nào sai) |
| 429 | `RATE_LIMITED` | Thử đăng nhập quá nhiều |

---

#### [2.2] Lấy hồ sơ hiện tại

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/auth/me` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | Auth (mọi role) · Chỉ trả dữ liệu của chính token |
| **Request Params & Headers** | `Authorization: Bearer <token>` |
| **Request Body** | Không có |

**Responses**: `200` → `{ "data": AuthUser }` (dùng để làm mới hạng/`totalSpent` sau khi đơn `delivered`).

**Error Handling**: chỉ lỗi chung `401`.

---

### 6.2 Nhóm Catalog (công khai)

#### [3] Dữ liệu tham chiếu cho bộ lọc

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/catalog/meta` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | Public |
| **Request Params & Headers** | Không có |
| **Request Body** | Không có |

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "categories": Category[], "brands": Brand[], "materials": Material[], "locations": Location[] } }` |

Frontend tự dựng cây danh mục từ `parentId`.

**Error Handling**: `500 INTERNAL_ERROR`.

---

#### [4] Danh sách / tìm kiếm / lọc sản phẩm

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/products` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | Public · Mặc định chỉ trả sản phẩm có ít nhất 1 biến thể `active`; `includeInactive=true` chỉ có hiệu lực với `admin` và bao gồm sản phẩm chưa có biến thể |

**Request Params (query)**

| Tên | Kiểu | Bắt buộc | Mô tả |
| :-- | :-- | :-: | :-- |
| `q` | string | | Tối đa 200 ký tự. FULLTEXT tên sản phẩm, bộ sưu tập và nhà thiết kế. Truy vấn chỉ có token ngắn dùng LIKE literal. |
| `categoryId` | number | | Gồm danh mục con trực tiếp |
| `brandId` | number[] (`1,3`) | | Lọc nhiều thương hiệu |
| `materialId` | number[] | | Có biến thể dùng chất liệu này |
| `minPrice`, `maxPrice` | number | | Theo giá nhỏ nhất của biến thể được xét |
| `isLimited` | boolean | | Chỉ bản giới hạn |
| `featured` | boolean | | Bộ sưu tập nổi bật cho P01 |
| `sort` | `newest \| price \| rating \| name` | | Whitelist, mặc định `newest` |
| `order` | `asc \| desc` | | Mặc định `desc` |
| `page`, `limit` | number | | Phân trang |
| `includeInactive` | boolean | | Chỉ admin (A05) |
| Header `Authorization` | string | | Tuỳ chọn, để nhận diện admin |

**Request Body**: Không có.

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": ProductSummary[], "meta": PageMeta }` |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | `sort` ngoài whitelist, `minPrice > maxPrice`, `limit > 100` |

---

#### [5] Chi tiết sản phẩm

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/products/:id` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | Public · Guest: `stock[].available = null`, chỉ có `inStock` · Đã đăng nhập: thấy số lượng khả dụng theo kho |

**Request Params**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả |
| :-- | :-- | :-- | :-: | :-- |
| `id` | path | number | ✔ | Mã sản phẩm |
| `reviewLimit` | query | number | | Số review trả kèm, mặc định 10 |
| `Authorization` | header | string | | Tuỳ chọn |

**Request Body**: Không có.

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": ProductDetail }` — với sản phẩm `isLimited`, mỗi variant có `edition: { total, available }` (vd. `{ total: 50, available: 12 }`) |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Sản phẩm không tồn tại |

---

### 6.3 Nhóm Orders

#### [6] Đặt hàng (thường và Limited Edition)

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/orders` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `customer` · R14: `unitPrice`, `discount`, `total` do server tính từ `product_variants.price` và `membership_tiers.discount_pct` |
| **Request Params & Headers** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Request Body**
```json
{
  "shippingAddress": "12 Lê Lợi, Q.1, TP.HCM",   // string 5–255, bắt buộc
  "items": [                                       // 1–20 dòng, bắt buộc
    {
      "variantId": 101,                            // number, bắt buộc
      "locationId": 2,                             // number, bắt buộc
      "quantity": 1,                               // number ≥1; = 1 nếu variant thuộc sản phẩm limited
      "customization": { "fabric": "Bouclé", "color": "Ivory" }   // object, tuỳ chọn
    }
  ]
}
```

**Responses**

| Status | Body |
| :-: | :-- |
| `201` | `{ "data": OrderDetail }` (status `pending`, `items[].serialNo` có giá trị cho bản Limited) |

**Ghi chú giao dịch & đồng thời**: toàn bộ chạy trong **một transaction**. Giữ tồn kho bằng atomic conditional UPDATE (`qtyOnHand - qtyReserved >= quantity`), không có version predicate hay retry loop. Limited dùng thêm `SELECT ... FOR UPDATE`, đánh dấu serial reserved ngay rồi gán vào từng `order_item`. Khoá theo `(variantId, locationId)` tăng dần để giảm nguy cơ deadlock. Bất kỳ dòng nào lỗi → rollback toàn bộ. Restock vẫn dùng optimistic version check.

**Error Handling**

| Status | Code | Điều kiện | Hành vi frontend |
| :-: | :-- | :-- | :-- |
| 404 | `NOT_FOUND` | Variant không tồn tại hoặc `discontinued` | Hiện thông báo từ API |
| 409 | `OUT_OF_STOCK` | Không đủ hàng hoặc không có dòng inventory tại kho đã chọn | Hiện thông báo hết hàng từ API |
| 409 | `EDITION_SOLD_OUT` | Hết bản Limited | Thông báo "vừa có người mua trước" |

---

#### [7] Danh sách đơn hàng

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/orders` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | `customer`: chỉ đơn của mình (R1). Sales dùng `GET /api/sales/orders?tab=unassigned` hoặc `tab=my_orders`. |

**Request Params (query)**

| Tên | Kiểu | Bắt buộc | Mô tả |
| :-- | :-- | :-: | :-- |
| `status` | OrderStatus | | Lọc theo trạng thái |
| `page`, `limit` | number | | Phân trang |
| `Authorization` | header | ✔ | |

**Request Body**: Không có.

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": OrderSummary[], "meta": PageMeta }` (sắp theo `orderDate` giảm dần) |

**Error Handling**: lỗi chung `400 / 401 / 403`.

---

#### [8] Chi tiết đơn hàng (kèm dòng hàng và lịch thanh toán)

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/orders/:id` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | `customer`: chủ đơn (R1). Sales và Admin dùng `GET /api/sales/orders/:id`. Sales chỉ đọc đơn của mình hoặc đơn chưa có người phụ trách. |
| **Request Params & Headers** | path `id: number` ✔ · `Authorization` ✔ |
| **Request Body** | Không có |

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": OrderDetail }` |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Đơn không tồn tại **hoặc** không thuộc quyền xem (không tiết lộ sự tồn tại) |

---

#### [9] Huỷ đơn hàng

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/orders/:id/cancel` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `customer`: chủ đơn, chỉ khi `pending` (R1, R2) · Sales dùng `POST /api/sales/orders/:id/cancel` cho đơn của mình đang `pending` hoặc `confirmed`, hoặc đơn `pending` chưa phân công |
| **Request Params & Headers** | path `id: number` ✔ · `Authorization` ✔ |

**Request Body**
```json
{ "reason": "Đổi ý" }   // string ≤255, tuỳ chọn
```

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "id": 501, "status": "cancelled" } }` |

**Ghi chú giao dịch**: trong một transaction — `UPDATE orders ... WHERE status = ?` (kiểm `affectedRows`), hoàn `qtyReserved` về kho, trả `edition_units` về `available`, chuyển các payment `pending` hoặc `overdue` sang `refunded` nếu đã có lịch.

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Đơn không tồn tại / không thuộc quyền |
| 409 | `INVALID_STATUS_TRANSITION` | Đơn không còn ở trạng thái cho phép huỷ (vd. Sales vừa xác nhận) |

---

#### [10] Lập lịch thanh toán cho đơn

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/sales/orders/:id/payments` hoặc `/api/orders/:id/payments` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `sales` · Đơn mình phụ trách (R7) · Đơn không ở `cancelled` |
| **Request Params & Headers** | path `id: number` ✔ · `Authorization` ✔ |

**Request Body**
```json
{
  "payments": [                                                  // 1–12 khoản
    { "type": "deposit",     "amount": 30000000, "dueDate": "2026-11-01" },
    { "type": "installment", "amount": 40000000, "dueDate": "2026-12-01" },
    { "type": "final",       "amount": 30000000, "dueDate": "2027-01-01" }
  ]
}
```
Ràng buộc: `amount > 0`; tổng các khoản chưa `refunded` (cũ + mới) **không vượt** `order.total`; tối đa một khoản `final`.

**Responses**

| Status | Body |
| :-: | :-- |
| `201` | `{ "data": Payment[] }` (toàn bộ lịch thanh toán của đơn sau khi thêm) |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | Tổng vượt `total`, `dueDate` trong quá khứ, nhiều hơn một `final` |
| 404 | `NOT_FOUND` | Đơn không tồn tại / không phụ trách |
| 409 | `INVALID_STATUS_TRANSITION` | Đơn đã `cancelled` |

---

### 6.4 Nhóm Payments

#### [11] Thanh toán một khoản

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/payments/:id/pay` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `customer` · Khoản thuộc đơn của mình (R1) |
| **Request Params & Headers** | path `id: number` (payment id) ✔ · `Authorization` ✔ |

**Request Body**
```json
{ "method": "bank_transfer" }   // "bank_transfer" | "card" | "cash", bắt buộc
```

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": Payment }` (status `paid`, `paidAt` đã gán) |

**Ghi chú đồng thời**: `UPDATE payments SET status='paid' ... WHERE id = ? AND status IN ('pending','overdue')`; `affectedRows = 0` → `ALREADY_PAID`. Chống trả trùng khi bấm hai lần.

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Khoản không tồn tại / không thuộc khách |
| 409 | `ALREADY_PAID` | Khoản đã `paid` hoặc `refunded` |
| 409 | `INVALID_STATUS_TRANSITION` | Đơn đã `cancelled` |

---

### 6.5 Nhóm Reviews

#### [12] Tạo đánh giá

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/reviews` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `customer` · R3: `orderItem` thuộc đơn của mình và đơn `delivered` · R4: mỗi `orderItem` chỉ một review |
| **Request Params & Headers** | `Authorization` ✔ |

**Request Body**
```json
{
  "orderItemId": 9001,     // number, bắt buộc (productId suy ra từ server)
  "rating": 5,             // integer 1–5, bắt buộc
  "comment": "Rất đẹp"     // string ≤2000, tuỳ chọn
}
```

**Responses**

| Status | Body |
| :-: | :-- |
| `201` | `{ "data": Review & { "productId": number, "orderItemId": number } }` |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | `orderItemId` không tồn tại |
| 409 | `NOT_ELIGIBLE_FOR_REVIEW` | Không phải đơn của mình hoặc đơn chưa `delivered` |
| 409 | `DUPLICATE_REVIEW` | Đã đánh giá dòng hàng này |

---

#### [13] Xoá đánh giá

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/reviews/:id` |
| **HTTP Method** | `DELETE` |
| **Authentication & Authorization** | `customer`: chỉ review của mình (R5) · `admin`: xoá bất kỳ (kiểm duyệt) |
| **Request Params & Headers** | path `id: number` ✔ · `Authorization` ✔ |
| **Request Body** | Không có |

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "id": 77, "deleted": true } }` |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Review không tồn tại |
| 403 | `FORBIDDEN` | Customer gọi xoá review của người khác |

---

### 6.6 Nhóm Sales

#### [14] Nhận đơn

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/sales/orders/:id/claim` |
| **HTTP Method** | `PATCH` |
| **Authentication & Authorization** | `sales` · R6: chỉ đơn `pending` và `salesUserId IS NULL` |
| **Request Params & Headers** | path `id: number` ✔ · `Authorization` ✔ |
| **Request Body** | Không có |

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "id": 501, "status": "confirmed", "salesUserId": 2 } }` |

**Ghi chú đồng thời**: `UPDATE orders SET sales_user_id = ?, status = 'confirmed' WHERE id = ? AND status = 'pending' AND sales_user_id IS NULL`. Hai Sales cùng bấm → chỉ một người thắng.

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Đơn không tồn tại |
| 409 | `ALREADY_CLAIMED` | Đơn đã có người nhận hoặc không còn `pending` (vd. khách vừa huỷ) |

---

#### [15] Cập nhật trạng thái đơn

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/sales/orders/:id/status` |
| **HTTP Method** | `PATCH` |
| **Authentication & Authorization** | `sales` · Đơn mình phụ trách (R7) · Chỉ các bước hợp lệ theo [ROLE_MATRIX §5](./ROLE_MATRIX.md) |
| **Request Params & Headers** | path `id: number` ✔ · `Authorization` ✔ |

**Request Body**
```json
{
  "status": "in_production",       // "in_production" | "shipped" | "delivered", bắt buộc
  "deliveryDate": "2026-12-15"     // DATE, bắt buộc khi chuyển sang in_production
}
```
Huỷ đơn dùng endpoint [9]; xác nhận đơn dùng endpoint [14].

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "id": 501, "status": "in_production", "deliveryDate": "2026-12-15" } }` |

**Ghi chú giao dịch**: chuyển `shipped → delivered` trong một transaction: cập nhật đơn, chuyển `qtyReserved` thành xuất kho (giảm `qtyOnHand`), đổi `edition_units` sang `sold`, cộng `customers.totalSpent`.

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | Thiếu `deliveryDate` khi sang `in_production` |
| 404 | `NOT_FOUND` | Đơn không tồn tại / không phụ trách |
| 409 | `INVALID_STATUS_TRANSITION` | Bước chuyển không hợp lệ (vd. `confirmed → shipped`) |

---

#### [16] Tra cứu tồn kho / cảnh báo sắp hết

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/sales/inventory` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | `sales` · `admin` (chỉ đọc) |

**Request Params (query)**

| Tên | Kiểu | Bắt buộc | Mô tả |
| :-- | :-- | :-: | :-- |
| `locationId` | number | | Lọc theo kho |
| `sku` | string | | Tìm theo SKU (tiền tố) |
| `lowStock` | number | | Nếu có: chỉ trả biến thể có **tổng khả dụng** < ngưỡng (Subquery + HAVING) |
| `page`, `limit` | number | | Phân trang |
| `Authorization` | header | ✔ | |

**Request Body**: Không có.

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": InventoryRow[], "meta": PageMeta }` |

```ts
interface InventoryRow {
  variantId: number; sku: string; productName: string;
  locationId: number; locationName: string;
  qtyOnHand: number; qtyReserved: number; available: number;
  version: number;            // gửi lại khi restock
  totalAvailable: number;     // tổng mọi kho của variant
}
```

**Error Handling**: lỗi chung `400 / 401 / 403`.

---

#### [17] Nhập thêm hàng

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/sales/inventory/restock` |
| **HTTP Method** | `PATCH` |
| **Authentication & Authorization** | `sales` |
| **Request Params & Headers** | `Authorization` ✔ |

**Request Body**
```json
{
  "variantId": 101,     // bắt buộc
  "locationId": 2,      // bắt buộc
  "quantity": 10,       // integer 1–10000, bắt buộc
  "version": 7          // version đọc được từ [16], bắt buộc
}
```
Nếu cặp `(variantId, locationId)` chưa có dòng tồn kho, server tạo mới (khi đó `version` gửi `0`).

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": InventoryRow }` (`version` đã tăng) |

**Error Handling**

| Status | Code | Điều kiện | Hành vi frontend |
| :-: | :-- | :-- | :-- |
| 404 | `NOT_FOUND` | Variant/location không tồn tại | |
| 409 | `VERSION_CONFLICT` | Ai đó vừa thay đổi tồn kho | Tải lại dòng và cho nhập lại |

---

#### [18] Danh sách công nợ

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/sales/receivables` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | `sales`: đơn mình phụ trách (R9) · `admin`: tất cả, chỉ đọc |

**Request Params (query)**

| Tên | Kiểu | Bắt buộc | Mô tả |
| :-- | :-- | :-: | :-- |
| `status` | `pending \| overdue` | | Mặc định cả hai |
| `dueBefore` | DATE | | Hạn trước ngày này (mặc định hôm nay khi xem quá hạn) |
| `page`, `limit` | number | | Phân trang |
| `Authorization` | header | ✔ | |

**Request Body**: Không có.

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": ReceivableRow[], "meta": PageMeta & { "totalOutstanding": number } }` |

```ts
interface ReceivableRow extends Payment {
  orderStatus: OrderStatus;
  customer: { id: number; fullName: string; phone: string | null };
  daysOverdue: number;   // 0 nếu chưa quá hạn
}
```

**Error Handling**: lỗi chung.

---

#### [19] Đánh dấu khoản quá hạn

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/sales/receivables/mark-overdue` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `sales` · Chỉ tác động lên đơn mình phụ trách (R9) |
| **Request Params & Headers** | `Authorization` ✔ |

**Request Body**
```json
{ "paymentIds": [301, 302] }   // tuỳ chọn; bỏ trống = mọi khoản pending có dueDate < hôm nay
```

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "updated": 2, "paymentIds": [301, 302] } }` |

Thực thi: `UPDATE payments ... SET status='overdue' WHERE status='pending' AND due_date < CURDATE() AND order_id IN (đơn của sales)`.

**Error Handling**: lỗi chung (khoản không thoả điều kiện bị bỏ qua, không báo lỗi).

---

### 6.7 Nhóm Admin – Catalog (FR14)

#### [20] Tạo sản phẩm

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/products` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | `Authorization` ✔ |

**Request Body**
```json
{
  "brandId": 1, "categoryId": 4,                 // bắt buộc
  "name": "Auren Lounge Chair",                  // 2–200, bắt buộc
  "description": "...", "collectionName": "Nordic Calm", "designerName": "L. Aalto",
  "isLimited": false, "isMadeToOrder": true      // boolean, mặc định false
}
```

**Responses**: `201` → `{ "data": ProductDetail }` (`variants: []`).

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | `brandId` / `categoryId` không tồn tại |

---

#### [21] Cập nhật sản phẩm

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/products/:id` |
| **HTTP Method** | `PATCH` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | path `id` ✔ · `Authorization` ✔ |
| **Request Body** | Bất kỳ tập con các trường của [20] (ít nhất 1 trường) |

**Responses**: `200` → `{ "data": ProductDetail }`.

**Error Handling**: `404 NOT_FOUND` (sản phẩm / brand / category không tồn tại).

---

#### [22] Xoá sản phẩm

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/products/:id` |
| **HTTP Method** | `DELETE` |
| **Authentication & Authorization** | `admin` · Chỉ xoá khi **không có biến thể nào** (hoặc không biến thể nào từng bán, server xoá kèm biến thể chưa bán) |
| **Request Params & Headers** | path `id` ✔ · `Authorization` ✔ |
| **Request Body** | Không có |

**Responses**: `200` → `{ "data": { "id": 12, "deleted": true } }`.

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Không tồn tại |
| 409 | `RESOURCE_IN_USE` | Có biến thể đã bán hoặc đã có review → đề xuất chuyển biến thể sang `discontinued` |

---

#### [23] Tạo biến thể (kèm chất liệu)

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/products/:id/variants` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | path `id` (productId) ✔ · `Authorization` ✔ |

**Request Body**
```json
{
  "sku": "AUR-LC-OAK-01",                 // ≤60, unique, bắt buộc
  "size": "80x85x75 cm", "finish": "Natural Oak",
  "price": 85000000,                      // ≥0, bắt buộc
  "leadTimeDays": 45,                     // ≥0, mặc định 0
  "status": "active",
  "materials": [                          // tổng portion ≤ 100
    { "materialId": 1, "portion": 70, "finishNote": "Oiled" },
    { "materialId": 3, "portion": 30 }
  ],
  "editionSize": 50                       // chỉ khi product.isLimited: sinh serial <variantId>-01/50…<variantId>-50/50
}
```

**Responses**: `201` → `{ "data": Variant }`.

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | Tổng `portion` > 100, `editionSize` gửi cho sản phẩm không limited |
| 404 | `NOT_FOUND` | Sản phẩm / chất liệu không tồn tại |
| 409 | `DUPLICATE_ENTRY` | Trùng `sku` |

---

#### [24] Cập nhật biến thể (kèm chất liệu)

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/variants/:id` |
| **HTTP Method** | `PATCH` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | path `id` ✔ · `Authorization` ✔ |
| **Request Body** | Tập con trường của [23] (trừ `editionSize`). Nếu gửi `materials` → **thay thế toàn bộ** danh sách chất liệu |

**Responses**: `200` → `{ "data": Variant }`. Đổi `price` không ảnh hưởng `unitPrice` của đơn cũ.

**Error Handling**: `404 NOT_FOUND`, `409 DUPLICATE_ENTRY` (sku), `400 VALIDATION_ERROR` (portion).

---

#### [25] Xoá biến thể

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/variants/:id` |
| **HTTP Method** | `DELETE` |
| **Authentication & Authorization** | `admin` · R11: chỉ khi chưa từng xuất hiện trong `order_items` |
| **Request Params & Headers** | path `id` ✔ · `Authorization` ✔ |
| **Request Body** | Không có |

**Responses**: `200` → `{ "data": { "id": 101, "deleted": true } }` (xoá kèm `variant_materials`, `inventory`, `edition_units` theo CASCADE).

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 404 | `NOT_FOUND` | Không tồn tại |
| 409 | `RESOURCE_IN_USE` | Đã từng bán → frontend gợi ý `PATCH status = discontinued` |

---

#### [26] [27] [28] CRUD dữ liệu tham chiếu

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `POST /api/admin/:resource` · `PATCH /api/admin/:resource/:id` · `DELETE /api/admin/:resource/:id` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | path `resource` ∈ `categories \| brands \| materials` (whitelist) ✔ · path `id` (PATCH/DELETE) ✔ · `Authorization` ✔ |

**Request Body theo `resource`** (PATCH: tập con, ít nhất 1 trường)

| `resource` | Body |
| :-- | :-- |
| `categories` | `{ "name": "Sofa góc", "slug": "sofa-goc", "parentId": 3 }` — `parentId` tuỳ chọn, không được tạo vòng |
| `brands` | `{ "name": "Auren", "country": "Denmark", "foundedYear": 1998 }` |
| `materials` | `{ "name": "Walnut", "type": "wood", "origin": "USA" }` |

Dữ liệu đọc lấy qua [3] `GET /api/catalog/meta`.

**Responses**

| Method | Status | Body |
| :-- | :-: | :-- |
| POST | `201` | `{ "data": Category \| Brand \| Material }` |
| PATCH | `200` | `{ "data": Category \| Brand \| Material }` |
| DELETE | `200` | `{ "data": { "id": 5, "deleted": true } }` |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | `resource` ngoài whitelist, `parentId` tạo vòng, `type` sai enum |
| 404 | `NOT_FOUND` | `id` / `parentId` không tồn tại |
| 409 | `DUPLICATE_ENTRY` | Trùng `name` / `slug` |
| 409 | `RESOURCE_IN_USE` | Xoá khi còn sản phẩm / danh mục con / biến thể tham chiếu |

---

### 6.8 Nhóm Admin – Báo cáo & Hạng thành viên (FR15)

#### [29] Báo cáo thống kê

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/reports/:type` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | `admin` |

**Request Params**

| Tên | Vị trí | Kiểu | Bắt buộc | Mô tả |
| :-- | :-- | :-- | :-: | :-- |
| `type` | path | `summary \| revenue \| brand-sales \| ratings \| top-customers` | ✔ | Loại báo cáo |
| `from`, `to` | query | DATE | | Khoảng thời gian (mặc định 12 tháng gần nhất) |
| `min` | query | number | | `brand-sales`: doanh số tối thiểu (HAVING) · `ratings`: số review tối thiểu, mặc định 3 |
| `limit` | query | number | | Top N, mặc định 10 |
| `Authorization` | header | string | ✔ | |

Chỉ tính đơn có `status <> 'cancelled'` (doanh thu ghi nhận theo đơn `delivered`).

**Request Body**: Không có.

**Responses** — `200` → `{ "data": ... }` theo `type`:

| `type` | `data` | Màn hình |
| :-- | :-- | :-- |
| `summary` | `{ revenue, orderCount, newCustomers, avgOrderValue, revenueByMonth: [{ month: "2026-10", revenue, orderCount }] }` | A01 |
| `revenue` | `[{ month, revenue, orderCount }]` | A02 |
| `brand-sales` | `[{ brandId, brandName, revenue, unitsSold }]` | A03 |
| `ratings` | `[{ productId, productName, avgRating, reviewCount }]` | A04 |
| `top-customers` | `{ averageSpent, customers: [{ customerId, fullName, tierName, totalSpent }] }` — khách chi tiêu > trung bình (Subquery) | A04 |

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | `type` ngoài whitelist, `from > to` |

---

#### [30] Danh sách hạng thành viên

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/tiers` |
| **HTTP Method** | `GET` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | `Authorization` ✔ |
| **Request Body** | Không có |

**Responses**: `200` → `{ "data": (Tier & { customerCount: number })[] }` (sắp theo `minSpent` tăng dần).

**Error Handling**: lỗi chung.

---

#### [31] Cập nhật hạng thành viên

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/tiers/:id` |
| **HTTP Method** | `PATCH` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | path `id` ✔ · `Authorization` ✔ |

**Request Body**
```json
{ "name": "Gold", "minSpent": 500000000, "discountPct": 5 }   // tập con; minSpent ≥ 0; discountPct 0–100
```

**Responses**: `200` → `{ "data": Tier }`. Không tự nâng/hạ hạng khách — dùng [32].

**Error Handling**

| Status | Code | Điều kiện |
| :-: | :-- | :-- |
| 400 | `VALIDATION_ERROR` | `discountPct` ngoài 0–100, `minSpent` âm |
| 404 | `NOT_FOUND` | Hạng không tồn tại |
| 409 | `DUPLICATE_ENTRY` | Trùng `name` |

---

#### [32] Nâng hạng tự động

| Mục | Nội dung |
| :-- | :-- |
| **Endpoint** | `/api/admin/tiers/recalculate` |
| **HTTP Method** | `POST` |
| **Authentication & Authorization** | `admin` |
| **Request Params & Headers** | `Authorization` ✔ |

**Request Body**
```json
{ "dryRun": false }   // true: chỉ đếm, không ghi
```

**Responses**

| Status | Body |
| :-: | :-- |
| `200` | `{ "data": { "dryRun": false, "affected": 14, "changes": [{ "tierId": 2, "tierName": "Gold", "count": 9 }] } }` |

Thực thi trong một transaction: mỗi khách được gán hạng có `minSpent` lớn nhất ≤ `totalSpent` (UPDATE + Subquery).

**Error Handling**: lỗi chung.

---

### 6.9 Quản lý người dùng và kiểm duyệt

Các endpoint sau yêu cầu Admin. Hai endpoint danh sách trả `{ data, meta: { page, limit, total, totalPages } }`. Mặc định `page=1`, `limit=20`, tối đa 100 mục mỗi trang.

| Endpoint | Input | Kết quả |
| --- | --- | --- |
| `GET /api/admin/users` | `q` theo email hoặc họ tên, `role` là `admin\|sales\|customer`, `page`, `limit` | `id`, `email`, `fullName`, `role`, `isActive`, `tierName`, `createdAt` |
| `POST /api/admin/users` | `fullName`, `email`, `password` (tối thiểu 8 ký tự, tối đa 72 byte UTF-8), `role` là `sales\|admin` | 201 và hồ sơ tóm tắt. Trùng email trả 409 `DUPLICATE_EMAIL`. |
| `PATCH /api/admin/users/:id/status` | `{ "isActive": false }` hoặc `true` | 200 với `id` và `isActive`. Khóa Admin trả 409 `ADMIN_DISABLE_FORBIDDEN`. |
| `GET /api/admin/reviews` | `q` theo tên sản phẩm hoặc khách, `rating` (1–5), `page`, `limit` | ID đánh giá, khách, sản phẩm và dòng đơn, tên khách/sản phẩm, `rating`, `comment`, `createdAt`. Mới nhất trước. |

Dùng `DELETE /api/reviews/:id` cho thao tác xóa. `GET /api/reviews/item/:orderItemId` dành cho Admin hoặc Customer sở hữu dòng đơn. Hồ sơ người dùng qua API quản trị không chứa mật khẩu hay hash.

## 7. Ma trận phủ FR ↔ Endpoint

| FR | Endpoint |
| :-- | :-- |
| FR0 | [2] (+ [33]) |
| FR1 | [1] |
| FR2 | [3], [4] |
| FR3 | [3], [4] |
| FR4 | [5] |
| FR5 | [6] |
| FR6 | [5] (số bản còn lại), [6] |
| FR7 | [8] (xem lịch), [11] |
| FR7b | [10] |
| FR8 | [7], [8] |
| FR9 | [9] |
| FR10 | [5] (xem), [12], [13], [36] |
| FR11 | `GET /api/sales/orders`, `GET /api/sales/orders/:id`, [14], [15] |
| FR12 | [16], [17] |
| FR13 | [18], [19] |
| FR14 | [4] (danh sách admin), [20]–[28] |
| FR15a | [29] |
| FR15b | [30], [31], [32] |

## 8. Ánh xạ sang mã nguồn

| Nhóm | Backend route | Frontend API |
| :-- | :-- | :-- |
| [1], [2], [33] | `auth.routes.ts` | `api/auth.api.ts` |
| [3]–[5] | `catalog.routes.ts` | `api/catalog.api.ts` |
| [6]–[10] | `order.routes.ts` | `api/order.api.ts` |
| [11] | `payment.routes.ts` | `api/payment.api.ts` |
| [12], [13] | `review.routes.ts` | `api/review.api.ts` |
| [14]–[19] | `sales.routes.ts` | `api/sales.api.ts` |
| [20]–[32], [34]–[36] | `admin.routes.ts` | `api/admin.api.ts` |
