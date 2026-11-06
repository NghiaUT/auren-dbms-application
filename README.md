# AUREN — Luxury Bespoke Furniture E-Commerce & Atelier Management System

> **Môn học:** Hệ Quản Trị Cơ Sở Dữ Liệu (CO3021 — Database Management Systems)  
> **DBMS:** MySQL 8.0+ (InnoDB Engine) — **100% Raw SQL (Prepared Statements, Không dùng ORM)**  
> **Kiến trúc:** Client–Server N-Tier (`Route` → `Controller` → `Service` → `Repository`)

---

## Mục lục

1. [Tổng quan Dự án & Điểm nhấn DBMS](#1-tổng-quan-dự-án--điểm-nhấn-dbms)
2. [Kiến trúc & Cấu trúc Thư mục](#2-kiến-trúc--cấu-trúc-thư-mục)
3. [Hướng dẫn Khởi chạy qua Docker Compose (Khuyên dùng)](#3-hướng-dẫn-khởi-chạy-qua-docker-compose-khuyên-dùng)
4. [Hướng dẫn Khởi chạy Trực tiếp trên Máy Local](#4-hướng-dẫn-khởi-chạy-trực-tiếp-trên-máy-local)
5. [Hệ thống Tạo sinh Dữ liệu Mẫu (`seed` & `seed:large`)](#5-hệ-thống-tạo-sinh-dữ-liệu-mẫu-seed--seedlarge)
6. [Tài khoản Demo theo Phân quyền (RBAC)](#6-tài-khoản-demo-theo-phân-quyền-rbac)
7. [Trọng tâm: Hệ thống Câu truy vấn SQL & Kỹ thuật DBMS](#7-trọng-tâm-hệ-thống-câu-truy-vấn-sql--kỹ-thuật-dbms)
8. [Kịch bản Đo kiểm Hiệu năng Indexing (`EXPLAIN ANALYZE`)](#8-kịch-bản-đo-kiểm-hiệu-năng-indexing-explain-analyze)

---

## 1. Tổng quan Dự án & Điểm nhấn DBMS

**AUREN** là hệ thống thương mại điện tử và quản trị vận hành cho thương hiệu nội thất xa xỉ chế tác thủ công (Bespoke & Limited Edition Furniture). Dự án được thiết kế chuyên biệt để minh họa trực quan các chủ đề cốt lõi của **Hệ Quản Trị Cơ Sở Dữ Liệu (DBMS)**:

- **Data Modeling & Storage (`database/schema.sql`)**: 16 bảng chuẩn hóa 3NF chia thành 6 phân hệ (`Users`, `Catalog`, `Inventory`, `Sales`, `Payment`, `Engagement`), kết hợp kiểu dữ liệu bán cấu trúc `JSON` (`order_items.customization` lưu cấu hình khắc biển đồng, chất liệu thửa riêng) và hệ thống ràng buộc toàn vẹn (`FOREIGN KEY`, `UNIQUE`, `CHECK`).
- **100% SQL Thuần tại Tầng Repository (`backend/src/repository/`)**: Không sử dụng ORM (Prisma/TypeORM/Sequelize). Mọi thao tác dữ liệu đều viết bằng SQL thuần qua `mysql2/promise` với **Prepared Statements (`?`)** và **Whitelist `ORDER BY`** chống SQL Injection.
- **Quản lý Giao dịch ACID (`withTransaction`)**: Đảm bảo tính nguyên tử (Atomicity) và cô lập (`REPEATABLE READ`) cho các luồng nghiệp vụ phức tạp như đặt hàng đa chi nhánh, phát hành lịch thanh toán trả góp, hủy đơn hoàn tồn kho và tính lại hạng thành viên.
- **Kiểm soát Đồng thời (Concurrency Control)**:
  - **Optimistic Locking (Khóa lạc quan)** qua cột `version` trên bảng `inventory` khi giữ tồn kho (`FR5`) và nhập kho (`FR12`).
  - **Pessimistic Locking (Khóa bi quan)** qua `SELECT ... FOR UPDATE` trên bảng `edition_units` khi nhiều khách hàng cùng đặt mua ấn bản giới hạn đánh số độc bản (`FR6`).
  - **Atomic State Transition (`WHERE status = ...`)** chống nhận đơn trùng giữa các Sales (`FR11`) và chống thanh toán hai lần (`FR7`).
- **Tối ưu hóa Truy vấn & Đánh chỉ mục (`database/indexes.sql`)**: Tách riêng tập lệnh Secondary B-Tree Composite Indexes và Fulltext Index kèm bộ công cụ sinh dữ liệu lớn (`seed-large.ts` từ `10.000` đến `100.000+` đơn hàng) để đo kiểm `EXPLAIN ANALYZE` trước và sau khi đánh index.

---

## 2. Kiến trúc & Cấu trúc Thư mục

| Thành phần | Công nghệ | Vai trò |
| :--- | :--- | :--- |
| **Frontend (`frontend/`)** | React 18, TypeScript, Vite, Tailwind CSS, Recharts | Giao diện SPA cho 4 nhóm tác nhân: Guest, Customer (Patron), Sales, Admin |
| **Backend (`backend/`)** | Node.js 20+, Express 4, TypeScript, Zod, JWT | RESTful API, Quản lý Transaction ACID, RBAC & Row-level Security |
| **Database (`database/`)** | MySQL 8.0+ (InnoDB) | Lưu trữ quan hệ, khóa dòng, kiểm tra ràng buộc `CHECK` & `FOREIGN KEY` |

```text
dbms-application/
├── docker-compose.yml              # Khởi chạy toàn bộ MySQL 8 + Seeder + Backend + Frontend
├── database/
│   ├── schema.sql                  # DDL tạo 16 bảng, PK, FK, UNIQUE, CHECK constraints
│   ├── indexes.sql                 # Secondary Indexes & Kịch bản đo EXPLAIN ANALYZE
│   ├── seed.sql                    # Dữ liệu mẫu SQL tĩnh cơ bản
│   ├── seed.ts                     # Wrapper gọi bộ sinh dữ liệu chuẩn (seed.ts)
│   └── seed_large.ts               # Wrapper gọi bộ sinh dữ liệu lớn (seed-large.ts)
├── backend/
│   ├── package.json
│   └── src/
│       ├── config/db.ts            # MySQL Connection Pool & withTransaction() helper
│       ├── middlewares/            # authenticate (JWT), authorize (RBAC), validate (Zod)
│       ├── routes/                 # Khai báo REST endpoints
│       ├── controllers/            # Tiếp nhận HTTP Request & trả Response
│       ├── services/               # Logic nghiệp vụ & Quản lý Transaction biên
│       ├── repository/             # ★ Toàn bộ các câu truy vấn SQL thuần (a -> h)
│       └── scripts/                # seed.ts, seed-large.ts, và các bộ test-core/admin/sales
└── frontend/
    ├── package.json
    └── src/
        ├── pages/public/           # P01 (Home), P02 (Catalog), P03 (Product Detail), P04/P05 (Auth)
        ├── pages/customer/         # C01 (Cart), C02 (Checkout), C03 (Limited Edition), C04-C08
        ├── pages/sales/            # S01-S07 (Order Queue, Process, Schedule, Inventory, Receivables)
        └── pages/admin/            # A01-A08 (Dashboard, Revenue, Brand Sales, Insights, Catalog, Tiers)
```

---

## 3. Hướng dẫn Khởi chạy qua Docker Compose (Khuyên dùng)

Dự án cung cấp cấu hình `docker-compose.yml` tích hợp sẵn **4 dịch vụ**: `mysql` (MySQL 8.0), `seeder` (Tự động nạp schema & chạy seed), `api` (Backend cổng `4000`) và `web` (Frontend cổng `5173`).

### 3.1. Khởi chạy tức thì toàn bộ ứng dụng
Tại thư mục gốc của dự án (`dbms-application/`), chạy lệnh:

```bash
docker compose up -d
```

> **Lưu ý trên Windows nếu máy bạn đã có sẵn MySQL chạy ở cổng `3306`**:  
> Nếu gặp lỗi `bind: Only one usage of each socket address (3306) is normally permitted`, bạn chỉ cần đổi cổng ánh xạ ra máy ngoài (ví dụ sang `3307`) mà không cần tắt MySQL trên máy:
> - **Trên PowerShell:**
>   ```powershell
>   $env:DB_PORT="3307"; docker compose up -d
>   ```
> - **Trên Command Prompt (CMD):** *(chú ý không để khoảng trắng trước dấu `&&`)*
>   ```cmd
>   set "DB_PORT=3307" && docker compose up -d
>   ```

Sau khi container khởi동 xong:
- **Frontend Web App**: http://localhost:5173
- **Backend API**: http://localhost:4000/api
- **MySQL 8.0**: `localhost:3306` (hoặc `3307` nếu đổi cổng) — User: `root`, Password: `rootpassword`, Database: `luxury_furniture`

### 3.2. Chạy lệnh Seed tùy chỉnh qua Docker Compose
Bạn có thể chạy lại dữ liệu mẫu bất kỳ lúc nào thông qua dịch vụ `seeder`:

```bash
# 1. Chạy lại bộ dữ liệu mẫu chuẩn (120 đơn hàng, đầy đủ mọi kịch bản nghiệp vụ)
docker compose run --rm seeder npm run seed

# 2. Sinh dữ liệu lớn (VD: 20.000 đơn hàng) để đo hiệu năng Indexing
docker compose run --rm seeder npm run seed:large -- 20000

# 3. Cộng dồn thêm 10.000 đơn hàng vào dữ liệu hiện có (--append)
docker compose run --rm seeder npm run seed:large -- 10000 --append
```

### 3.3. Dừng và xóa sạch dữ liệu (Reset Database Volume)
```bash
docker compose down -v
```

---

## 4. Hướng dẫn Khởi chạy Trực tiếp trên Máy Local

### 4.1. Yêu cầu hệ thống
- **Node.js**: `>= 20.x`
- **MySQL Server**: `>= 8.0.16` (đang chạy tại `localhost:3306`)

### 4.2. Cài đặt thư viện & Cấu hình biến môi trường

1. **Cài đặt dependencies cho Backend và Frontend**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Tạo file `backend/.env`** (sao chép từ `backend/.env.example`):
   ```env
   NODE_ENV=development
   PORT=4000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=luxury_furniture
   JWT_SECRET=auren_luxury_furniture_jwt_secret_2026
   JWT_EXPIRES_IN=8h
   CORS_ORIGIN=http://localhost:5173
   DB_ENGINE=mysql
   ```

### 4.3. Khởi tạo Schema, Nạp dữ liệu mẫu & Chạy ứng dụng

```bash
# Bước 1: Chạy script seed (tự động tạo bảng từ schema.sql nếu chưa có và nạp dữ liệu chuẩn)
npm --prefix backend run seed

# Bước 2: Khởi chạy Backend API (Terminal 1 - Cổng 4000)
npm --prefix backend run dev

# Bước 3: Khởi chạy Frontend Vite SPA (Terminal 2 - Cổng 5173)
npm --prefix frontend run dev
```

*(Trên Windows PowerShell nếu bị chặn `npm.ps1`, hãy thêm `cmd /c "..."` phía trước, ví dụ: `cmd /c "npm --prefix backend run seed"`).*

---

## 5. Hệ thống Tạo sinh Dữ liệu Mẫu (`seed` & `seed:large`)

Dự án trang bị 2 công cụ tạo sinh dữ liệu bằng TypeScript kết nối trực tiếp vào MySQL:

| Lệnh thực thi (từ thư mục gốc) | File nguồn | Quy mô & Mục đích sử dụng |
| :--- | :--- | :--- |
| `npm --prefix backend run seed` | `backend/src/scripts/seed.ts` | **Quy mô vừa (Chuẩn Use-Case)**:<br>• 3 hạng thành viên (`Silver`, `Gold`, `Black`)<br>• 29 tài khoản (`1 Admin`, `3 Sales`, `25 Customers` kèm 2 khách đủ điều kiện nâng hạng để demo `FR15b`)<br>• 8 thương hiệu, 11 danh mục phân cấp, 10 chất liệu, 15 sản phẩm, 34 biến thể<br>• 110 bản khắc `edition_units` (đồng bộ chính xác `sold` / `reserved` / `available` với `order_items`)<br>• Tồn kho đa vị trí trên 6 Showroom/Warehouse (đồng bộ `qty_reserved` khớp với các đơn đang xử lý + biến thể sắp hết hàng `< 5` cho `FR12`)<br>• **120 đơn hàng** trải đều 12 tháng qua 6 trạng thái, **248 kỳ thanh toán** (`deposit`, `installment`, `final`, có khoản `overdue` cho `FR13`) và **48 đánh giá** xác thực. |
| `npm --prefix backend run seed:large -- [N] [--append]` | `backend/src/scripts/seed-large.ts` | **Quy mô lớn (Benchmark Hiệu năng & Indexing)**:<br>• Tự động đảm bảo dữ liệu nền từ `seed.ts` (hoặc giữ nguyên nếu truyền `--append`).<br>• Bulk-insert theo lô (`BATCH_SIZE = 1000` đơn/transaction) với tốc độ cao (~5.000 đơn/giây):<br>&nbsp;&nbsp;+ `N` đơn hàng (mặc định `10.000`, hỗ trợ `50.000 - 100.000+`)<br>&nbsp;&nbsp;+ `~2N` dòng chi tiết đơn hàng (`order_items`) kèm JSON `customization`<br>&nbsp;&nbsp;+ `~2.2N` bản ghi lịch thanh toán (`payments`)<br>&nbsp;&nbsp;+ Tự động đồng bộ lại `customers.total_spent` bằng câu lệnh `UPDATE ... JOIN`. |

---

## 6. Tài khoản Demo theo Phân quyền (RBAC)

Mật khẩu mặc định cho **tất cả tài khoản** sau khi chạy `seed`: **`Password123!`**

| Vai trò (Role) | Email đăng nhập | Quyền hạn & Phạm vi chức năng |
| :--- | :--- | :--- |
| **Admin (`admin`)** | `admin@furniture.com` | • Quản trị sản phẩm, biến thể, chất liệu, danh mục, thương hiệu (`FR14`)<br>• Xem báo cáo phân tích doanh thu, thương hiệu, đánh giá, khách VIP (`FR15a`)<br>• Cấu hình hạng thành viên & chạy xét duyệt nâng/hạ hạng tự động (`FR15b`)<br>• *Bị chặn hoàn toàn khỏi giỏ hàng & luồng đặt mua cá nhân.* |
| **Sales (`sales`)** | `sales@furniture.com`<br>`sales.hn@furniture.com`<br>`sales.hcm@furniture.com` | • Nhận phụ trách đơn hàng mới (`Claim`), cập nhật tiến độ đơn hàng (`FR11`)<br>• Lập lịch thanh toán trả góp cho đơn hàng giá trị lớn (`FR7b`)<br>• Tra cứu tồn kho đa chi nhánh, lọc biến thể sắp hết & nhập kho (`FR12`)<br>• Quản lý công nợ & quét đánh dấu khoản thu quá hạn (`FR13`)<br>• *Bị chặn hoàn toàn khỏi giỏ hàng & luồng đặt mua cá nhân.* |
| **Customer (`customer`)** | `vip@example.com` *(Hạng Black - giảm 10%)*<br>`gold@example.com` *(Hạng Gold - giảm 5%)*<br>`customer@example.com` *(Hạng Silver - 0%)* | • Duyệt/lọc danh mục sản phẩm (`FR2, FR3`), xem chi tiết & tồn kho (`FR4`)<br>• Thêm vào giỏ hàng, đặt hàng thường (`FR5`) & mua bản Limited Edition (`FR6`)<br>• Thanh toán đặt cọc / trả góp (`FR7`), theo dõi & hủy đơn đang chờ (`FR8, FR9`)<br>• Viết đánh giá xác thực cho sản phẩm đã giao (`FR10`). |

---

## 7. Trọng tâm: Hệ thống Câu truy vấn SQL & Kỹ thuật DBMS

Toàn bộ các câu truy vấn SQL trong hệ thống được phân loại từ **(a) đến (h)** và đặt tại thư mục `backend/src/repository/`. Dưới đây là các câu truy vấn tiêu biểu nhất thể hiện sức mạnh của CSDL quan hệ MySQL 8:

### 7.1. Ma trận Phân loại Truy vấn theo Repository

| Nhóm kỹ thuật SQL | Mô tả | Vị trí triển khai tiêu biểu |
| :--- | :--- | :--- |
| **Loại (a) — `INSERT`** | Chèn bản ghi đơn/đa bảng trong Transaction, lưu kiểu `JSON` | `order.repository.ts` (`createOrder`, `createOrderItem`) |
| **Loại (b) — `DELETE`** | Xóa có kiểm tra ràng buộc toàn vẹn tham chiếu (`RESTRICT` / Safe Delete) | `catalog.repository.ts` (`deleteProductSafe`), `review.repository.ts` |
| **Loại (c) — `UPDATE` (& Locking)** | Cập nhật trạng thái nguyên tử, Optimistic Locking (`version`) & Pessimistic Locking (`FOR UPDATE`) | `inventory.repository.ts`, `edition.repository.ts`, `payment.repository.ts` |
| **Loại (d) — `SELECT` & Filter (đơn điều kiện)** | Truy vấn có điều kiện động, `LIKE`, `IN`, `BETWEEN`, Whitelist `ORDER BY`, `LIMIT/OFFSET` | `catalog.repository.ts` (`findAll`), `order.repository.ts` |
| **Loại (e) — Date/Time Query (điều kiện ghép)** | Xử lý thời gian với `DATE_FORMAT`, `DATEDIFF`, `CURDATE()`, `NOW()` | `payment.repository.ts` (`findReceivables`, `markOverduePayments`) |
| **Loại (f) — Multi-table `JOIN`** | Kết nối từ 3 đến 5 bảng (`INNER JOIN`, `LEFT JOIN`) | `report.repository.ts` (`getBrandSalesReport`), `order.repository.ts` |
| **Loại (g) — `SUBQUERY`** | Truy vấn lồng trong `WHERE`, `FROM` (Derived Table) và `UPDATE ... SET` | `report.repository.ts` (`getTopCustomersReport`), `tier.repository.ts` (`recalculateTiers`) |
| **Loại (h) — Aggregate + `GROUP BY` + `HAVING`** | Thống kê tổng hợp với `SUM`, `COUNT`, `AVG`, `MIN`, `MAX`, `COALESCE`, `CASE WHEN` | `report.repository.ts`, `catalog.repository.ts`, `inventory.repository.ts` |

---

### 7.2. Chi tiết các Câu truy vấn & Cơ chế Giao dịch Tiêu biểu

#### ① Tìm kiếm & Lọc Sản phẩm Đa chiều kết hợp `JOIN` 5 bảng, `SUBQUERY`, `GROUP BY` & `HAVING` (FR2, FR3)
- **File**: `backend/src/repository/catalog.repository.ts` (`findAll`)
- **Điểm nhấn DBMS**: Kết hợp lọc danh mục đệ quy cha-con (`parent_id`), lọc chất liệu qua bảng nối N:M `variant_materials` bằng `IN (SELECT DISTINCT ...)`, gom nhóm theo sản phẩm và lọc khoảng giá trên giá trị tổng hợp `MIN(pv.price)` bằng mệnh đề `HAVING`:

```sql
SELECT 
  p.id, p.name, p.collection_name AS collectionName, p.designer_name AS designerName,
  p.is_limited AS isLimited, p.is_made_to_order AS isMadeToOrder,
  b.id AS brandId, b.name AS brandName,
  c.id AS categoryId, c.name AS categoryName,
  MIN(pv.price) AS minPrice,
  ROUND(AVG(r.rating), 1) AS avgRating,
  COUNT(DISTINCT r.id) AS reviewCount
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN categories c ON p.category_id = c.id
JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN reviews r ON p.id = r.product_id
WHERE pv.status = 'active'
  AND (p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))
  AND p.id IN (
    SELECT DISTINCT pv2.product_id
    FROM product_variants pv2
    JOIN variant_materials vm ON pv2.id = vm.variant_id
    WHERE vm.material_id IN (?)
  )
GROUP BY p.id, b.id, b.name, c.id, c.name
HAVING minPrice >= ? AND minPrice <= ?
ORDER BY minPrice ASC
LIMIT ? OFFSET ?;
```

---

#### ② Kiểm soát Đồng thời bằng Optimistic Locking khi Giữ tồn kho (FR5)
- **File**: `backend/src/repository/inventory.repository.ts` (`checkAndReserveStock`)
- **Điểm nhấn DBMS**: Không khóa cứng bảng khi nhiều khách đặt hàng thường cùng lúc. Sử dụng cột `version` kèm điều kiện kiểm tra tồn kho khả dụng `(qty_on_hand - qty_reserved) >= ?`. Nếu `affectedRows === 0`, Service lập tức rollback transaction và trả về mã `409 Conflict`:

```sql
UPDATE inventory
SET qty_reserved = qty_reserved + ?,
    version = version + 1
WHERE variant_id = ?
  AND location_id = ?
  AND version = ?
  AND (qty_on_hand - qty_reserved) >= ?;
```

---

#### ③ Kiểm soát Đồng thời bằng Pessimistic Locking (`SELECT ... FOR UPDATE`) cho Limited Edition (FR6)
- **File**: `backend/src/repository/edition.repository.ts` (`lockAvailableUnit` & `assignUnitToOrderItem`)
- **Điểm nhấn DBMS**: Mỗi tác phẩm Limited Edition chỉ có một số lượng bản khắc cố định (ví dụ `01/15` đến `15/15`). Trong một Transaction `REPEATABLE READ`, câu lệnh `FOR UPDATE` khóa cứng dòng serial khả dụng tiếp theo, buộc giao dịch đồng thời của khách hàng khác phải chờ cho tới khi giao dịch hiện tại commit:

```sql
-- Bước 1: Khóa độc quyền (Exclusive Row Lock) bản đánh số khả dụng nhỏ nhất
SELECT id, serial_no AS serialNo
FROM edition_units
WHERE variant_id = ? AND status = 'available'
ORDER BY id ASC
LIMIT 1
FOR UPDATE;

-- Bước 2: Gán bản khắc vào dòng đơn hàng vừa tạo
UPDATE edition_units
SET order_item_id = ?,
    status = 'reserved'
WHERE id = ? AND status = 'available';
```

---

#### ④ Cảnh báo Tồn kho Sắp hết bằng Derived Table Subquery (FR12)
- **File**: `backend/src/repository/inventory.repository.ts` (`findInventoryList`)
- **Điểm nhấn DBMS**: Tính tổng tồn kho khả dụng `SUM(qty_on_hand - qty_reserved)` trên toàn bộ các Showroom/Kho cho từng biến thể thông qua Derived Table `tot`, sau đó lọc ra các biến thể có tổng tồn toàn hệ thống thấp hơn ngưỡng cảnh báo `lowStock`:

```sql
SELECT 
  i.variant_id AS variantId, v.sku, p.name AS productName,
  i.location_id AS locationId, l.name AS locationName,
  i.qty_on_hand AS qtyOnHand, i.qty_reserved AS qtyReserved,
  (i.qty_on_hand - i.qty_reserved) AS available,
  i.version, tot.total_available AS totalAvailable
FROM inventory i
JOIN product_variants v ON i.variant_id = v.id
JOIN products p ON v.product_id = p.id
JOIN locations l ON i.location_id = l.id
JOIN (
  SELECT variant_id, SUM(qty_on_hand - qty_reserved) AS total_available
  FROM inventory
  GROUP BY variant_id
) tot ON i.variant_id = tot.variant_id
WHERE tot.total_available < ?
ORDER BY v.sku ASC, l.id ASC
LIMIT ? OFFSET ?;
```

---

#### ⑤ Quản lý Công nợ, Tính số ngày quá hạn (`DATEDIFF`) & Cập nhật `JOIN` theo Quyền sở hữu Dòng (FR13)
- **File**: `backend/src/repository/payment.repository.ts` (`findReceivables` & `markOverduePayments`)
- **Điểm nhấn DBMS**:
  - Sử dụng hàm thời gian thực `GREATEST(0, DATEDIFF(CURDATE(), p.due_date))` để tính số ngày trễ hạn của từng kỳ thanh toán.
  - Câu lệnh `UPDATE ... JOIN` kết hợp kiểm tra **Row-level Security (`o.sales_user_id = ?`)** đảm bảo nhân viên Sales nào chỉ được đánh dấu quá hạn cho các đơn hàng do chính mình phụ trách:

```sql
UPDATE payments p
JOIN orders o ON p.order_id = o.id
SET p.status = 'overdue'
WHERE p.status = 'pending'
  AND p.due_date < CURDATE()
  AND o.sales_user_id = ?;
```

---

#### ⑥ Các Truy vấn Phân tích Đa chiều cho Admin Dashboard (FR15a)
- **File**: `backend/src/repository/report.repository.ts`

1. **Thống kê Doanh thu theo Tháng (`DATE_FORMAT` + `GROUP BY`)**:
   ```sql
   SELECT 
     DATE_FORMAT(o.order_date, '%Y-%m') AS month,
     COALESCE(SUM(o.total), 0) AS revenue,
     COUNT(o.id) AS orderCount
   FROM orders o
   WHERE o.status = 'delivered' AND o.order_date >= ? AND o.order_date <= ?
   GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
   ORDER BY month ASC;
   ```

2. **Báo cáo Doanh số theo Thương hiệu (`JOIN` 5 bảng + `GROUP BY` + `HAVING`)**:
   ```sql
   SELECT 
     b.id AS brandId, b.name AS brandName, 
     COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
     COALESCE(SUM(oi.quantity), 0) AS unitsSold
   FROM brands b
   JOIN products p ON b.id = p.brand_id
   JOIN product_variants pv ON p.id = pv.product_id
   JOIN order_items oi ON pv.id = oi.variant_id
   JOIN orders o ON oi.order_id = o.id
   WHERE o.status = 'delivered'
   GROUP BY b.id, b.name
   HAVING revenue >= ?
   ORDER BY revenue DESC
   LIMIT ?;
   ```

3. **Truy vấn Khách hàng VIP chi tiêu vượt mức trung bình toàn hệ thống (Scalar `SUBQUERY`)**:
   ```sql
   SELECT 
     c.id AS customerId, u.full_name AS fullName, 
     t.name AS tierName, c.total_spent AS totalSpent
   FROM customers c
   JOIN users u ON c.user_id = u.id
   JOIN membership_tiers t ON c.tier_id = t.id
   WHERE c.total_spent > (
     SELECT AVG(total_spent) FROM customers WHERE total_spent > 0
   )
   ORDER BY c.total_spent DESC
   LIMIT ?;
   ```

---

#### ⑦ Xét duyệt Nâng/Hạ hạng Thành viên Hàng loạt bằng Correlated Subquery (FR15b)
- **File**: `backend/src/repository/tier.repository.ts` (`recalculateTiers`)
- **Điểm nhấn DBMS**: Hỗ trợ chế độ xem trước (`dryRun = true`) và thực thi thật (`dryRun = false`) trong Transaction. Đối chiếu `total_spent` của từng khách hàng với ngưỡng `min_spent` cao nhất mà khách đạt được thông qua Correlated Subquery:

```sql
UPDATE customers c
SET c.tier_id = (
  SELECT t2.id 
  FROM membership_tiers t2 
  WHERE t2.min_spent <= c.total_spent 
  ORDER BY t2.min_spent DESC 
  LIMIT 1
)
WHERE c.tier_id <> (
  SELECT t3.id 
  FROM membership_tiers t3 
  WHERE t3.min_spent <= c.total_spent 
  ORDER BY t3.min_spent DESC 
  LIMIT 1
) OR c.tier_id IS NULL;
```

---

## 8. Kịch bản Đo kiểm Hiệu năng Indexing (`EXPLAIN ANALYZE`)

File `database/indexes.sql` được thiết kế tách biệt khỏi `database/schema.sql` để phục vụ thực nghiệm đo tốc độ truy vấn trước và sau khi đánh chỉ mục B-Tree.

### Quy trình thực hiện:

1. **Bước 1 — Bơm dữ liệu lớn (ví dụ `30.000` đơn hàng, `~60.000` dòng hàng, `~66.000` khoản thanh toán)**:
   ```bash
   npm --prefix backend run seed:large -- 30000
   ```

2. **Bước 2 — Đo `EXPLAIN ANALYZE` khi CHƯA có Secondary Index**:
   Chạy khối lệnh gỡ index (Phần 5 trong `database/indexes.sql`), sau đó chạy các truy vấn kiểm thử (Phần 4 trong `database/indexes.sql`):
   ```sql
   -- Ví dụ Q1: Lọc đơn hàng đã giao có giá trị lớn (> 200 triệu VNĐ)
   EXPLAIN ANALYZE
   SELECT id, total FROM orders WHERE status = 'delivered' AND total > 200000000;

   -- Ví dụ Q4: Tìm các khoản thanh toán đang chờ nhưng đã quá hạn
   EXPLAIN ANALYZE
   SELECT id, order_id, amount FROM payments WHERE status = 'pending' AND due_date < CURDATE();
   ```
   *(Quan sát: `type: ALL` — Full Table Scan, số dòng quét `rows` lớn, thời gian thực thi cao).*

3. **Bước 3 — Tạo bộ Composite Indexes từ `database/indexes.sql`**:
   ```bash
   mysql -u root -p luxury_furniture < database/indexes.sql
   ```
   Các chỉ mục quan trọng được tạo bao gồm:
   - `idx_orders_status_total ON orders (status, total)` *(Covering Index cho Q1)*
   - `idx_orders_customer_date ON orders (customer_id, order_date)` *(Tối ưu phân trang lịch sử đơn FR8)*
   - `idx_orders_date ON orders (order_date)` *(Tối ưu báo cáo doanh thu theo tháng FR15a)*
   - `idx_orders_sales_status ON orders (sales_user_id, status)` *(Tối ưu hàng đợi đơn của Sales FR11)*
   - `idx_payments_status_due ON payments (status, due_date)` *(Tối ưu quét công nợ quá hạn FR13)*
   - `idx_variants_product_price ON product_variants (product_id, price)` *(Tối ưu lọc giá FR3)*

4. **Bước 4 — Chạy lại `EXPLAIN ANALYZE` và đối chiếu**:
   *(Quan sát: Kế hoạch thực thi chuyển sang `type: range` hoặc `ref`, sử dụng `Using index` / `Using index condition`, giảm số dòng đọc từ hàng chục nghìn xuống chỉ còn các dòng thỏa điều kiện).*
