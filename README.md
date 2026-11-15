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
  - **Atomic conditional UPDATE** giữ tồn kho theo số lượng khả dụng (`FR5`); InnoDB serialize writer trên cùng dòng. **Optimistic Locking** qua `version` chỉ dùng khi nhập kho (`FR12`).
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
│   ├── indexes.sql                 # Secondary indexes
│   ├── explain-indexes.sql         # EXPLAIN trước/sau cho B-Tree
│   ├── explain-fulltext.sql        # EXPLAIN cho tìm kiếm catalog
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

Trên Windows, chạy [script kiểm Docker Engine](docs/DOCKER_WINDOWS.md) trước khi
dùng Compose. Script dùng Docker Desktop CLI, tránh mở thêm instance và báo lỗi
rõ khi Codex sandbox không truy cập được phiên Windows thường.

```bash
docker compose up -d
docker compose ps -a
docker compose logs seeder
```

Mở [AUREN](http://localhost:5173). Kiểm tra API tại [health](http://localhost:4000/health).
Compose đợi MySQL nhận kết nối TCP, chạy `db:setup` để tạo bảng và index, nạp dữ liệu mẫu khi chưa có tài khoản, rồi khởi động API và web. Seeder thoát mã 0 khi hoàn tất. Có thể đặt `DB_PORT`, `API_PORT` và `WEB_PORT` nếu cổng mặc định đang dùng.

Khi cập nhật checkout có volume cũ, chạy lại `docker compose up -d`. Bootstrap bổ sung cột `users.is_active` với mặc định active và áp dụng index còn thiếu. Để chạy bootstrap thủ công, dùng `docker compose run --rm seeder`. Dùng `docker compose down` để dừng và giữ volume.

Để reset dữ liệu **demo đã xác định có thể xóa**, dừng API bằng `docker compose stop web api`, chạy `docker compose run --rm seeder sh -c "npm ci && npm run db:init && npm run seed"`, rồi chạy `docker compose up -d`. Lệnh `seed` trực tiếp sẽ xóa dữ liệu trong 16 bảng trước khi nạp lại. Dùng project Compose riêng nếu cần demo sạch mà vẫn giữ volume hiện tại.

## 4. Hướng dẫn Khởi chạy Trực tiếp trên Máy Local

Cần Node.js 20 và MySQL 8.0.18 trở lên. Sao chép `backend/.env.example` thành `backend/.env`, điền thông tin kết nối MySQL và đặt `JWT_SECRET` riêng cho môi trường local. Tài khoản MySQL dùng cho bootstrap cần quyền tạo database, bảng và index trong `DB_NAME`.

```bash
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run db:setup
npm --prefix backend run dev
```

Terminal thứ hai chạy `npm --prefix frontend run dev`. `db:init` tạo schema và production indexes. `db:setup` chạy `db:init` rồi nạp seed khi bảng `users` trống. Để chủ động nạp lại dữ liệu đã xác nhận có thể xóa, chạy `npm --prefix backend run seed` sau khi đã tạo schema.

## 5. Hệ thống Tạo sinh Dữ liệu Mẫu (`seed` & `seed:large`)

Seed mặc định tạo 40 tài khoản (1 Admin, 4 Sales, 35 Customer), 3 hạng, 10 thương hiệu, 16 danh mục, 12 chất liệu, 30 sản phẩm, 53 biến thể, 6 địa điểm, 318 bản ghi tồn kho, 110 serial Limited Edition, 120 đơn, 240 dòng đơn, 172 khoản thanh toán và 45 đánh giá.

`npm --prefix backend run seed:large -- 30000` thay dữ liệu giao dịch để đo indexing. Chạy trên database benchmark riêng đã có dữ liệu nền từ `db:setup`. Mặc định là 20.000 đơn. Dùng seed mặc định cho luồng demo nghiệp vụ.

## 6. Tài khoản Demo theo Phân quyền (RBAC)

Mật khẩu chung của dữ liệu mẫu là **`password123`**. Hạng và chiết khấu bên dưới phản ánh kết quả tính từ `total_spent` sau fresh seed.

| Vai trò | Email | Dùng trong demo |
| --- | --- | --- |
| Admin | `admin@luxury.com` | Báo cáo, catalog, hạng, người dùng và kiểm duyệt đánh giá |
| Sales | `sales.nam@luxury.com`, `sales.hoa@luxury.com`, `sales.minh@luxury.com`, `sales.linh@luxury.com` | Nhận đơn, bàn giao, kho và công nợ |
| Customer Silver | `customer.silver@gmail.com` | Đặt hàng và thanh toán, giảm 0% |
| Customer Gold | `tu.le@design.vn` | Kiểm tra giảm 5% |
| Customer Black | `customer.black@gmail.com` | Kiểm tra giảm 10% |

Màn hình đăng nhập có điền nhanh cho Admin, Sales Nam và Customer Silver. Xem [kịch bản demo](docs/HAPPY_PATH_DEMO.md).

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
- **Điểm nhấn DBMS**: Kết hợp lọc danh mục và danh mục con trực tiếp (`parent_id`), lọc chất liệu qua bảng nối N:M `variant_materials` bằng `IN (SELECT DISTINCT ...)`, gom nhóm theo sản phẩm và lọc khoảng giá trên giá trị tổng hợp `MIN(pv.price)` bằng mệnh đề `HAVING`:

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
  AND MATCH(p.name, p.collection_name, p.designer_name) AGAINST (? IN NATURAL LANGUAGE MODE)
  AND (p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))
  AND p.id IN (
    SELECT DISTINCT pv2.product_id
    FROM product_variants pv2
    JOIN variant_materials vm ON pv2.id = vm.variant_id
    WHERE vm.material_id IN (?)
  )
GROUP BY p.id, b.id, b.name, c.id, c.name
HAVING minPrice >= ? AND minPrice <= ?
ORDER BY minPrice ASC, p.id ASC
LIMIT ? OFFSET ?;
```

---

#### ② Giữ tồn kho bằng atomic conditional UPDATE (FR5)
- **File**: `backend/src/repository/inventory.repository.ts` (`reserveStockIfAvailable`)
- **Điểm nhấn DBMS**: InnoDB khóa dòng và đánh giá điều kiện tồn kho trên trạng thái hiện tại khi writer được chạy. Không dùng version đọc trước hay retry loop. `affectedRows === 0` nghĩa là thiếu hàng hoặc không có dòng tồn kho; Service rollback và trả `409 OUT_OF_STOCK`. `version` vẫn tăng làm change token cho restock:

```sql
UPDATE inventory
SET qty_reserved = qty_reserved + ?,
    version = version + 1
WHERE variant_id = ?
  AND location_id = ?
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

-- Bước 2: Đánh dấu reserved ngay, trước khi chọn serial cho dòng tiếp theo
UPDATE edition_units SET status = 'reserved' WHERE id = ?;

-- Bước 3: Gán bản khắc đã giữ vào dòng đơn hàng vừa tạo
UPDATE edition_units
SET order_item_id = ?,
    status = 'reserved'
WHERE id = ? AND status = 'reserved' AND order_item_id IS NULL;
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

`GET /api/products?q=sofa` dùng chỉ mục `ftx_products_search` trên `name`, `collection_name` và `designer_name`. MySQL dùng parser mặc định của InnoDB, collation `utf8mb4_unicode_ci` và cấu hình mặc định ba ký tự cho token. Nếu từ khóa chỉ chứa token ngắn hoặc dấu câu, hệ thống dùng `LIKE` dạng chứa và coi `%` / `_` là ký tự thường. Stopword trong truy vấn FULLTEXT do MySQL xử lý. Kết quả vẫn dùng bộ lọc và sắp xếp của catalog.

Dùng schema benchmark riêng hoặc dừng web/API trước khi gỡ FULLTEXT. Các chỉ mục hỗ trợ khóa ngoại, PRIMARY và UNIQUE được giữ lại. Thao tác `apply` và `drop` có thể chạy lại. Các lệnh dưới đây dùng MySQL CLI và cấu hình DB từ `backend/.env` cho các lệnh npm.

```bash
npm --prefix backend run db:indexes:status
npm --prefix backend run db:indexes:drop
mysql -u root -p luxury_furniture < database/explain-indexes.sql
npm --prefix backend run db:indexes:apply
mysql -u root -p luxury_furniture < database/explain-indexes.sql
mysql -u root -p luxury_furniture < database/explain-fulltext.sql
```

Với Compose, tạo schema benchmark bằng `docker compose exec -T -e DB_NAME=auren_index_test api npm run db:setup`. Thay `db:setup` bằng `db:indexes:drop` hoặc `db:indexes:apply` để đổi chế độ. Truyền tệp SQL vào `docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -D auren_index_test'`. Trong PowerShell, dùng `Get-Content -Raw database/explain-indexes.sql | docker compose exec ...` để cấp stdin.

So sánh `type`, `key`, số dòng ước lượng và số dòng thực trên cùng dataset. Bài đo FULLTEXT so sánh `LIKE '%sofa%'` với predicate `MATCH` của ứng dụng. Hai cách có ngữ nghĩa tìm kiếm khác nhau. MySQL có thể chọn quét bảng cho dữ liệu nhỏ hoặc bộ lọc kém chọn lọc.

Kết quả kiểm chứng ngày 10/11/2026 trên MySQL 8.0.46 với seed mặc định và `ANALYZE TABLE`:

| Truy vấn | Trước | Sau |
| --- | --- | --- |
| Đơn đã giao trên 200 triệu | Quét bảng, đọc 120 dòng | `range` qua `idx_orders_status_total`, đọc 38 dòng |
| Khoản chờ thu đã quá hạn | Quét bảng, đọc 172 dòng | `range` qua `idx_payments_status_due`, đọc 9 dòng |
| Catalog với từ khóa `sofa` | `LIKE` dạng chứa, `type=ALL` | `MATCH` dùng `ftx_products_search`, `type=fulltext` cả trong truy vấn có JOIN |

## 9. Kiểm thử

```bash
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

Smoke test ghi dữ liệu. Dùng một schema sạch có tên kết thúc bằng `_test` và `NODE_ENV=test`. Ví dụ khi Compose đang chạy:

```bash
docker compose exec -T -e DB_NAME=auren_smoke_test -e NODE_ENV=test -e SQL_LOG=off api sh -c 'npm run db:setup && npm run test:all'
```

Dùng tên schema mới mỗi lần cần chạy lại từ dữ liệu sạch. `test:smoke` chạy tuần tự core, Customer, Sales, Admin và HTTP API. `test:concurrency` dùng fixture riêng, kiểm stock 800/800 và 100/800, rollback, claim/payment/schedule/delivery/cancellation, serial và duplicate review. `test:all` chạy cả hai suite; yêu cầu `NODE_ENV=test`, `DB_NAME` kết thúc `_test`. Pipeline [CI](.github/workflows/ci.yml) chạy build/typecheck/smoke/concurrency với Node 20 và MySQL 8.0 trên pull request và push vào `main`, `chore/demo-readiness` hoặc `fix/final-app-hardening`.
