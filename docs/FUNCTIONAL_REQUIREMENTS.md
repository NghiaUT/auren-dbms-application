# FUNCTIONAL_REQUIREMENTS - Danh Sách Yêu Cầu Chức Năng (FR) Hệ Thống AUREN DBMS

> Tài liệu này chuẩn hóa và tập trung toàn bộ các **Yêu Cầu Chức Năng (Functional Requirements - FR)** của hệ thống ứng dụng quản lý kinh doanh nội thất kiến trúc cao cấp **AUREN Sovereign Architectural Furniture DBMS** (CO3021 - HCMUT).

---

## 1. Bảng Tổng Hợp Danh Sách FR

Hệ thống bao gồm **15 FR cốt lõi**, **1 FR bổ trợ quy trình (FR7b)**, **1 FR xác thực nền tảng (FR0)** và **2 chức năng quản trị tài khoản**, phục vụ 4 vai trò người dùng: **Guest** (Khách vãng lai), **Customer** (Khách hàng), **Sales** (Nhân viên kinh doanh/Showroom), **Admin** (Quản trị viên hệ thống).

| Mã FR | Tên chức năng | Vai trò chính | Màn hình liên quan | Endpoint API chính | Điểm nhấn kỹ thuật DBMS / Ràng buộc |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **FR0** | Đăng nhập / Đăng xuất | Tất cả vai trò | `P04`, `P05`, `C08`, Header | `POST /api/auth/login`<br>`POST /api/auth/logout`<br>`GET /api/auth/me` | JWT Token, phân quyền RBAC (Role-based Access Control), lưu vết phiên làm việc |
| **FR1** | Đăng ký tài khoản khách hàng | Guest | `P05` (`/register`) | `POST /api/auth/register` | Tự động gán role `customer`, khởi tạo hạng thành viên Silver, `total_spent = 0` |
| **FR2** | Xem danh mục sản phẩm & thương hiệu | Công khai | `P01` (`/`), `P02` (`/products`) | `GET /api/catalog/products`<br>`GET /api/catalog/categories`<br>`GET /api/catalog/brands` | Phân cấp danh mục cha - con (`parent_id`), nạp dữ liệu phân trang |
| **FR3** | Tìm kiếm & Lọc nâng cao đa chiều | Công khai | `P02` (`/products`) | `GET /api/catalog/products` (query params) | `JOIN` 5 bảng, `IN (SELECT DISTINCT ...)`, `GROUP BY` & `HAVING MIN(pv.price) BETWEEN ? AND ?`, Composite B-Tree & Fulltext Index |
| **FR4** | Xem chi tiết sản phẩm & biến thể | Công khai | `P03` (`/products/:id`) | `GET /api/catalog/products/:id` | Gom nhóm biến thể & chất liệu trong 1 truy vấn JOIN (tránh N+1); Guest chỉ thấy cờ Còn/Hết, User thấy số lượng tồn chi tiết |
| **FR5** | Đặt hàng tiêu chuẩn & Giữ tồn kho | Customer | `C01` (`/cart`), `C02` (`/checkout`) | `POST /api/orders` | **Optimistic Locking** qua cột `version` trên bảng `inventory` khi giữ chỗ kho; Transaction tự động tính chiết khấu theo hạng |
| **FR6** | Mua tác phẩm Limited Edition | Customer | `C03` (`/products/:id#limited`), `C02` | `POST /api/orders` | **Pessimistic Locking** (`SELECT ... FOR UPDATE`) trên bảng `edition_units` ở mức `REPEATABLE READ`, cấp bản khắc serial duy nhất |
| **FR7** | Khách hàng thanh toán trả khoản | Customer | `C06` (`/account/orders/:id/payments`) | `POST /api/payments/:id/pay` | **Atomic State Transition** (`UPDATE payments ... WHERE status = 'pending'`), chống double-payment, bảo mật row-level |
| **FR7b** | Lập lịch thanh toán nhiều kỳ cho đơn hàng | Sales | `S04` (`/sales/orders/:id/schedule`) | `POST /api/orders/:id/schedule` | Chia kỳ thanh toán (đặt cọc, đợt sản xuất, quyết toán); kiểm tra tổng các đợt bằng chính xác `orders.total_amount` |
| **FR8** | Lịch sử đơn hàng & Tiến trình thanh toán | Customer, Sales, Admin | `C04`, `C05`, `S02`, `S03` | `GET /api/orders`<br>`GET /api/orders/:id`<br>`GET /api/orders/:id/payments` | Tối ưu phân trang với index composite `idx_orders_customer_date (customer_id, order_date)`; hiển thị thuộc tính JSON `customization` |
| **FR9** | Hủy đơn hàng & Hoàn trả tài nguyên | Customer, Sales | `C05`, `S03` | `POST /api/orders/:id/cancel` | Transaction hoàn tác toàn diện: giải phóng `qty_reserved`, trả trạng thái `edition_units` về `available`, hủy các khoản nợ pending |
| **FR10** | Đánh giá sản phẩm đã mua | Customer, Admin | `C07` (`/account/reviews`), `P03`, `A10` | `POST /api/reviews`<br>`DELETE /api/reviews/:id`<br>`GET /api/reviews/product/:id` | Xác thực mua hàng qua `INSERT ... SELECT WHERE status = 'delivered'`; ràng buộc chống trùng `UNIQUE(customer_id, order_item_id)` |
| **FR11** | Tiếp nhận & Xử lý đơn hàng | Sales | `S01` (`/sales`), `S02`, `S03` | `POST /api/sales/orders/:id/claim`<br>`PATCH /api/sales/orders/:id/status` | Atomic Claiming chống 2 Sales nhận cùng đơn (`WHERE sales_user_id IS NULL`); khi `delivered` tự động cộng dồn `customers.total_spent` |
| **FR12** | Quản lý tồn kho & Cảnh báo sắp hết hàng | Sales, Admin | `S05` (`/sales/inventory`), `S06` | `GET /api/sales/inventory`<br>`GET /api/sales/inventory/low-stock`<br>`POST /api/sales/inventory/restock` | Derived Table Subquery tính tổng khả dụng `(qty_on_hand - qty_reserved)` trên toàn hệ thống; nhập kho có kiểm soát `version` |
| **FR13** | Quản lý công nợ & Quét nợ quá hạn | Sales, Admin | `S07` (`/sales/receivables`) | `GET /api/sales/receivables`<br>`POST /api/sales/receivables/mark-overdue` | Index `idx_payments_status_due (status, due_date)`; tính ngày trễ hạn bằng hàm `DATEDIFF()`; cập nhật hàng loạt nợ quá hạn qua `UPDATE ... JOIN` |
| **FR14** | Quản trị danh mục, sản phẩm & biến thể | Admin | `A05`, `A06`, `A07` | `POST/PUT/DELETE /api/admin/products`<br>`POST/PUT/DELETE /api/admin/variants`<br>`POST/PUT/DELETE /api/admin/categories`... | Ràng buộc khóa ngoại toàn vẹn dữ liệu (RESTRICT); xóa biến thể an toàn bằng kiểm tra `NOT EXISTS (SELECT 1 FROM order_items ...)` |
| **FR15a** | Báo cáo & Thống kê kinh doanh | Admin | `A01` (`/admin`), `A02`, `A03`, `A04` | `GET /api/admin/reports/revenue`<br>`GET /api/admin/reports/brands`<br>`GET /api/admin/reports/reviews`<br>`GET /api/admin/reports/insights` | 4 báo cáo OLAP: doanh thu theo tháng (index `idx_orders_date`), doanh số thương hiệu (`GROUP BY` + `HAVING`), điểm đánh giá, khách chi tiêu trên trung bình |
| **FR15b** | Quản lý & Tự động xét duyệt hạng thành viên | Admin | `A08` (`/admin/tiers`) | `GET/POST/PUT /api/admin/tiers`<br>`POST /api/admin/tiers/recalculate` | Quét phân hạng tự động bằng **Correlated Subquery** khớp với `customers.total_spent`; hỗ trợ chế độ kiểm tra trước (`dryRun = true`) |
| *(Phụ 1)* | Quản lý người dùng hệ thống | Admin | `A09` (`/admin/users`) | `GET/POST/PATCH /api/admin/users` | Tạo tài khoản Sales/Admin, khóa/mở khóa tài khoản, phân quyền quản trị |
| *(Phụ 2)* | Xem và cập nhật hồ sơ cá nhân | Customer, Sales, Admin | `C08` (`/account/profile`) | `GET/PATCH /api/users/profile` | Tra cứu thông tin cá nhân, hạng thành viên hiện tại, phần trăm chiết khấu và tổng chi tiêu lũy kế |

---

## 2. Chi Tiết Từng Yêu Cầu Chức Năng

### FR0: Đăng nhập & Đăng xuất (Authentication & Session Management)
- **Mục tiêu**: Quản lý định danh và phiên làm việc của người dùng trong hệ thống.
- **Tác nhân**: Mọi vai trò (Guest, Customer, Sales, Admin).
- **Quy tắc nghiệp vụ**:
  - Đăng nhập xác thực bằng Email và Mật khẩu (mã hóa bcrypt).
  - Trả về mã JWT chứa thông tin nhận diện cơ bản (`userId`, `role`, `email`).
  - Đăng xuất thu hồi trạng thái phiên làm việc ở client (xóa token khỏi state/storage).

### FR1: Đăng ký tài khoản (Customer Self-Registration)
- **Mục tiêu**: Cho phép khách vãng lai tự mở tài khoản định danh trên hệ thống.
- **Tác nhân**: Guest.
- **Quy tắc nghiệp vụ**:
  - Chỉ cho phép tạo tài khoản có vai trò `customer`. Tài khoản `sales` và `admin` bắt buộc do Quản trị viên khởi tạo trong trang quản trị.
  - Tự động liên kết tạo bản ghi trong bảng `customers` với hạng thành viên mặc định là Silver (chiết khấu 0%) và tổng chi tiêu khởi tạo bằng 0.

### FR2: Xem danh mục sản phẩm theo phân cấp & thương hiệu (Browse Catalog)
- **Mục tiêu**: Cung cấp khả năng duyệt cây danh mục sản phẩm và thương hiệu đối tác.
- **Tác nhân**: Công khai (Guest, Customer, Sales, Admin).
- **Quy tắc nghiệp vụ**:
  - Hỗ trợ danh mục phân cấp đa tầng (quan hệ đệ quy cha-con qua `categories.parent_id`).
  - Cho phép người dùng duyệt sản phẩm theo từng danh mục hoặc theo từng thương hiệu sản xuất.

### FR3: Tìm kiếm và Lọc nâng cao đa chiều (Advanced Product Search & Filtering)
- **Mục tiêu**: Tra cứu nhanh danh mục sản phẩm theo nhiều tiêu chí kết hợp.
- **Tác nhân**: Công khai.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Tìm kiếm toàn văn (Fulltext search) theo tên và mã sản phẩm.
  - Lọc đa chiều kết hợp: Danh mục cha/con, Thương hiệu, Chất liệu cấu thành (truy vấn quan hệ N:M qua bảng `variant_materials` bằng `IN (SELECT DISTINCT ...)`).
  - Lọc theo khoảng giá biến thể tối thiểu và tối đa dựa trên hàm tổng hợp `MIN(pv.price)` gom nhóm theo sản phẩm kết hợp mệnh đề `HAVING`.
  - Phân trang kết quả và sắp xếp an toàn theo danh sách whitelist (`price:asc`, `price:desc`, `newest`).

### FR4: Xem chi tiết sản phẩm, biến thể và cấu hình chất liệu (Product Details)
- **Mục tiêu**: Hiển thị hồ sơ thiết kế chi tiết của một sản phẩm nội thất kiến trúc.
- **Tác nhân**: Công khai.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Tối ưu hóa truy vấn: Gom toàn bộ thông tin biến thể (kích thước, hoàn thiện, SKU, đơn giá) và chất liệu cấu thành trong 1 truy vấn JOIN duy nhất, loại bỏ triệt để lỗi truy vấn N+1.
  - Kiểm soát hiển thị tồn kho: Guest chỉ thấy cờ trạng thái "Còn hàng" hoặc "Hết hàng". Người dùng đã đăng nhập xem được số lượng tồn khả dụng chi tiết theo từng chi nhánh/kho.

### FR5: Đặt hàng tiêu chuẩn & Giữ chỗ tồn kho (Standard Order Placement)
- **Mục tiêu**: Khách hàng đặt mua các sản phẩm tiêu chuẩn từ giỏ hàng.
- **Tác nhân**: Customer.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Thực thi toàn bộ trong một Transaction ACID duy nhất.
  - Kiểm tra và tự động áp dụng mức giảm giá dựa trên hạng thành viên của khách hàng (`membership_tiers.discount_percent`).
  - Cơ chế **Khóa lạc quan (Optimistic Locking)**: Giữ tồn kho trên bảng `inventory` bằng điều kiện so khớp phiên bản:
    ```sql
    UPDATE inventory 
    SET qty_reserved = qty_reserved + ?, version = version + 1 
    WHERE id = ? AND version = ? AND (qty_on_hand - qty_reserved) >= ?
    ```
  - Nếu `affectedRows === 0` (xung đột tồn kho hoặc có người mua trước làm cạn hàng khả dụng), hệ thống lập tức rollback và phản hồi mã lỗi `409 Conflict`.

### FR6: Mua tác phẩm giới hạn & Cấp bản khắc độc bản (Limited Edition Order)
- **Mục tiêu**: Khách hàng đặt mua các tuyệt tác giới hạn có khắc số sê-ri độc bản (VD: 01/15 đến 15/15).
- **Tác nhân**: Customer.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Cơ chế **Khóa bi quan (Pessimistic Locking)**: Trong Transaction ở mức cô lập `REPEATABLE READ`, sử dụng câu lệnh khóa độc quyền dòng dữ liệu:
    ```sql
    SELECT id, serial_number, unit_number 
    FROM edition_units 
    WHERE variant_id = ? AND status = 'available' 
    ORDER BY unit_number ASC 
    LIMIT 1 FOR UPDATE
    ```
  - Khóa chặt bản ghi serial khả dụng tiếp theo, ép các giao dịch đồng thời khác phải chờ cho đến khi giao dịch hiện tại commit hoặc rollback, ngăn chặn tuyệt đối tình trạng bán trùng số bản khắc.

### FR7: Khách hàng thanh toán trả khoản / đợt cọc (Customer Installment Payment)
- **Mục tiêu**: Khách hàng thanh toán cho từng đợt theo lịch thanh toán của đơn hàng.
- **Tác nhân**: Customer (Row-level security: chỉ thanh toán các đơn thuộc quyền sở hữu của chính mình).
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Cơ chế **Chuyển trạng thái nguyên tử (Atomic State Transition)**:
    ```sql
    UPDATE payments 
    SET status = 'paid', paid_at = NOW(), transaction_ref = ? 
    WHERE id = ? AND status = 'pending'
    ```
  - Kiểm tra `affectedRows === 1` nhằm ngăn chặn tình trạng thanh toán trùng lặp khi người dùng click liên tiếp hoặc nhận webhook thanh toán kép.

### FR7b: Lập lịch thanh toán nhiều kỳ cho đơn hàng (Payment Scheduling)
- **Mục tiêu**: Nhân viên Sales thiết lập kế hoạch thanh toán trả chậm/trả góp nhiều giai đoạn cho các đơn hàng giá trị cao.
- **Tác nhân**: Sales (chỉ áp dụng cho đơn hàng mình đang nhận phụ trách).
- **Quy tắc nghiệp vụ**:
  - Thiết lập các mốc: Tiền đặt cọc ban đầu (Deposit), Thanh toán tiến độ hoàn thiện (Installment), Quyết toán bàn giao (Final).
  - Kiểm tra điều kiện toàn vẹn tài chính: Tổng số tiền của toàn bộ các kỳ thanh toán bắt buộc phải bằng chính xác giá trị thực tế của đơn hàng (`orders.total_amount`).

### FR8: Tra cứu lịch sử đơn hàng & Tiến trình thanh toán (Order History & Timeline)
- **Mục tiêu**: Theo dõi tình trạng thực hiện đơn hàng, chi tiết sản phẩm và các đợt đóng tiền.
- **Tác nhân**: Customer (xem đơn của mình), Sales (xem đơn mình phụ trách), Admin (xem toàn bộ đơn).
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Hỗ trợ lưu trữ và hiển thị các thuộc tính tùy biến sâu dưới định dạng JSON (`order_items.customization`).
  - Đánh chỉ mục hỗn hợp `idx_orders_customer_date (customer_id, order_date)` để tối ưu tốc độ phân trang và sắp xếp thời gian đơn hàng của khách hàng.

### FR9: Hủy đơn hàng & Hoàn trả tài nguyên an toàn (Order Cancellation)
- **Mục tiêu**: Khách hàng hoặc Sales hủy đơn hàng chưa hoàn thành theo đúng nghiệp vụ.
- **Tác nhân**: Customer (hủy đơn của mình khi trạng thái là `pending`), Sales (hủy đơn mình phụ trách khi trạng thái là `pending` hoặc `confirmed`).
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Thực hiện trong Transaction hoàn tác:
    1. Hoàn trả số lượng tồn kho khả dụng (`qty_reserved = qty_reserved - qty`).
    2. Giải phóng các số bản khắc Limited Edition liên kết (`edition_units.status = 'available'`).
    3. Hủy bỏ các đợt thanh toán chưa trả (`payments.status = 'cancelled'`).
    4. Cập nhật trạng thái đơn sang `cancelled`.

### FR10: Đánh giá xác thực sản phẩm đã mua (Verified Product Reviews)
- **Mục tiêu**: Khách hàng gửi nhận xét, chấm điểm cho sản phẩm đã được giao thành công.
- **Tác nhân**: Customer (tạo/xóa review của mình), Admin (xóa vi phạm/kiểm duyệt), Public (chỉ đọc).
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Chèn an toàn thông qua câu lệnh:
    ```sql
    INSERT INTO reviews (customer_id, product_id, order_item_id, rating, comment)
    SELECT ?, oi.product_id, oi.id, ?, ?
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.customer_id = ? AND oi.id = ? AND o.status = 'delivered'
    ```
  - Ràng buộc toàn vẹn duy nhất `UNIQUE (customer_id, order_item_id)` đảm bảo mỗi món hàng đã mua chỉ được đánh giá tối đa một lần.

### FR11: Tiếp nhận và Xử lý tiến độ đơn hàng (Sales Order Claiming & Workflow)
- **Mục tiêu**: Nhân viên Sales tiếp nhận đơn hàng mới và cập nhật trạng thái đơn trong suốt vòng đời bàn giao.
- **Tác nhân**: Sales.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Tiếp nhận đơn không tranh chấp (Atomic Claiming):
    ```sql
    UPDATE orders 
    SET sales_user_id = ?, status = 'confirmed' 
    WHERE id = ? AND status = 'pending' AND sales_user_id IS NULL
    ```
  - Cập nhật tiến độ theo chu trình trạng thái chuẩn: `confirmed` $\to$ `processing` $\to$ `shipped` $\to$ `delivered`.
  - Khi đơn chuyển sang `delivered`, hệ thống tự động tích lũy doanh số vào `customers.total_spent` làm cơ sở xét duyệt hạng.
  - Chỉ mục `idx_orders_sales_status (sales_user_id, status)` tối ưu truy vấn danh sách công việc của Sales.

### FR12: Quản lý tồn kho & Cảnh báo sắp hết hàng (Inventory & Low-Stock Alerts)
- **Mục tiêu**: Giám sát tồn kho thực tế, tồn kho giữ chỗ và nhập thêm hàng hóa tại các showroom/kho.
- **Tác nhân**: Sales (xem và nhập kho), Admin (chỉ xem).
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Sử dụng bảng dẫn xuất (**Derived Table Subquery**) gom tổng lượng tồn khả dụng trên toàn hệ thống và lọc cảnh báo:
    ```sql
    SELECT * FROM (
      SELECT pv.id, pv.sku, SUM(inv.qty_on_hand - inv.qty_reserved) AS total_available
      FROM product_variants pv
      JOIN inventory inv ON pv.id = inv.variant_id
      GROUP BY pv.id, pv.sku
    ) tot 
    WHERE tot.total_available <= ?
    ```
  - Nhập hàng (Restock) an toàn bằng cách cập nhật tăng `qty_on_hand` đi kèm kiểm tra phiên bản `version` chống ghi đè dữ liệu.

### FR13: Quản lý công nợ & Quét khoản thu quá hạn (Receivables & Overdue Management)
- **Mục tiêu**: Theo dõi công nợ các đơn hàng và phát hiện các khoản tiền trễ hạn đóng tiền.
- **Tác nhân**: Sales (theo dõi các đơn do mình phụ trách), Admin (xem toàn hệ thống).
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Tính số ngày quá hạn thanh toán theo thời gian thực bằng hàm `DATEDIFF(CURRENT_DATE, p.due_date)`.
  - Quét và cập nhật hàng loạt trạng thái quá hạn bằng truy vấn JOIN:
    ```sql
    UPDATE payments p
    JOIN orders o ON p.order_id = o.id
    SET p.status = 'overdue'
    WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE
    ```
  - Chỉ mục tổng hợp `idx_payments_status_due (status, due_date)` tối ưu hóa tốc độ quét công nợ quá hạn.

### FR14: Quản trị danh mục, sản phẩm, biến thể & chất liệu (Admin Catalog Management)
- **Mục tiêu**: Quản trị viên quản lý danh mục dữ liệu sản phẩm, phân cấp ngành hàng và đặc tính kỹ thuật.
- **Tác nhân**: Admin.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - Toàn quyền CRUD trên các bảng: `products`, `product_variants`, `categories`, `brands`, `materials`, `variant_materials`, `locations`, `edition_units`.
  - Ràng buộc khóa ngoại bảo vệ toàn vẹn: Không thể xóa sản phẩm/biến thể đã phát sinh giao dịch.
  - Xóa biến thể an toàn với câu lệnh kiểm tra `NOT EXISTS`:
    ```sql
    DELETE FROM product_variants 
    WHERE id = ? AND NOT EXISTS (SELECT 1 FROM order_items WHERE variant_id = ?)
    ```

### FR15a: Báo cáo & Thống kê kinh doanh đa chiều (Business Analytics & Reporting)
- **Mục tiêu**: Cung cấp các báo cáo phân tích tổng quan và chuyên sâu cho Quản trị viên phục vụ ra quyết định.
- **Tác nhân**: Admin.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  Bao gồm 4 báo cáo OLAP tiêu biểu:
  1. **Doanh thu & Số lượng đơn theo tháng**: Gom nhóm theo thời gian, tối ưu bằng index `idx_orders_date (order_date)`.
  2. **Doanh số và thị phần theo thương hiệu**: Kết hợp `GROUP BY b.id` và mệnh đề lọc điều kiện nhóm `HAVING SUM(...) >= ?`.
  3. **Thống kê điểm đánh giá & phân bổ chất lượng**: Tính trung bình sao, tổng lượt đánh giá cho từng sản phẩm.
  4. **Phân tích khách hàng chi tiêu vượt trung bình (VIP Insights)**: Lọc các khách hàng có `total_spent` cao hơn giá trị trung bình toàn hệ thống thông qua Subquery độc lập.

### FR15b: Quản lý & Tự động xét duyệt hạng thành viên (Membership Tier Management & Auto-Promotion)
- **Mục tiêu**: Thiết lập chính sách ưu đãi thành viên và tự động nâng/hạ hạng khách hàng theo tích lũy chi tiêu.
- **Tác nhân**: Admin.
- **Quy tắc nghiệp vụ & Điểm nhấn DBMS**:
  - CRUD cấu hình các hạng thành viên (`membership_tiers`): Tên hạng, mức chi tiêu tối thiểu (`min_spent`), tỷ lệ giảm giá (`discount_percent`).
  - Thuật toán xét duyệt nâng/hạ hạng hàng loạt sử dụng **Correlated Subquery**:
    ```sql
    UPDATE customers c
    SET c.tier_id = (
      SELECT t.id 
      FROM membership_tiers t 
      WHERE c.total_spent >= t.min_spent 
      ORDER BY t.min_spent DESC 
      LIMIT 1
    )
    ```
  - Cung cấp hai chế độ thực thi:
    - `dryRun = true`: Chỉ tính toán, liệt kê danh sách khách hàng sẽ đổi hạng kèm chi tiết hạng cũ $\to$ hạng mới mà không ghi vào DB.
    - `dryRun = false`: Áp dụng trực tiếp cập nhật dữ liệu trong Transaction.

---

## 3. Chức Năng Bổ Trợ (Supplementary Modules)

### Quản lý người dùng hệ thống (User Management)
- **Mục tiêu**: Quản trị danh sách nhân sự nội bộ và tài khoản khách hàng.
- **Tác nhân**: Admin.
- **Chức năng**: Xem danh sách người dùng (`GET /api/admin/users`), tạo mới tài khoản nhân viên Sales hoặc Admin phụ tá (`POST /api/admin/users`), khóa/mở khóa tài khoản (`PATCH /api/admin/users/:id/status`), đặt lại mật khẩu.
- **Màn hình**: `A09` (`/admin/users`).

### Xem & Cập nhật hồ sơ cá nhân (User Profile)
- **Mục tiêu**: Người dùng tra cứu thông tin cá nhân và quyền lợi hạng thành viên của mình.
- **Tác nhân**: Customer, Sales, Admin.
- **Chức năng**: Xem thông tin tài khoản, cập nhật số điện thoại, địa chỉ nhận hàng, tra cứu tổng chi tiêu tích lũy và tỷ lệ chiết khấu hiện hành của bản thân.
- **Màn hình**: `C08` (`/account/profile`).

---

## 4. Ma Trận Ánh Xạ Tổng Thể (Traceability Matrix)

| Mã FR | Tầng Repository | Tầng Service | Tầng Controller / Routes | Màn hình Giao Diện (FE) |
| :--- | :--- | :--- | :--- | :--- |
| **FR0** | `user.repository.ts` | `auth.service.ts` | `auth.routes.ts` | `P04`, `P05`, `C08` |
| **FR1** | `user.repository.ts`, `customer.repository.ts` | `auth.service.ts` | `auth.routes.ts` | `P05` |
| **FR2** | `catalog.repository.ts` | `catalog.service.ts` | `catalog.routes.ts` | `P01`, `P02` |
| **FR3** | `catalog.repository.ts` | `catalog.service.ts` | `catalog.routes.ts` | `P02` |
| **FR4** | `variant.repository.ts`, `catalog.repository.ts` | `catalog.service.ts` | `catalog.routes.ts` | `P03` |
| **FR5** | `order.repository.ts`, `inventory.repository.ts` | `order.service.ts` | `order.routes.ts` | `C01`, `C02` |
| **FR6** | `edition.repository.ts`, `order.repository.ts` | `order.service.ts` | `order.routes.ts` | `C03`, `C02` |
| **FR7** | `payment.repository.ts` | `payment.service.ts` | `payment.routes.ts` | `C06` |
| **FR7b** | `payment.repository.ts`, `order.repository.ts` | `sales.service.ts` | `order.routes.ts` | `S04` |
| **FR8** | `order.repository.ts`, `payment.repository.ts` | `order.service.ts` | `order.routes.ts` | `C04`, `C05` |
| **FR9** | `order.repository.ts`, `inventory.repository.ts`, `edition.repository.ts` | `order.service.ts` | `order.routes.ts` | `C05`, `S03` |
| **FR10** | `review.repository.ts` | `review.service.ts` | `review.routes.ts` | `C07`, `P03`, `A10` |
| **FR11** | `order.repository.ts`, `customer.repository.ts` | `sales.service.ts` | `sales.routes.ts` | `S01`, `S02`, `S03` |
| **FR12** | `inventory.repository.ts` | `sales.service.ts` | `sales.routes.ts` | `S05`, `S06` |
| **FR13** | `payment.repository.ts` | `sales.service.ts` | `sales.routes.ts` | `S07` |
| **FR14** | `catalog.repository.ts`, `variant.repository.ts` | `admin.service.ts` | `admin.routes.ts` | `A05`, `A06`, `A07` |
| **FR15a**| `report.repository.ts` | `report.service.ts` | `admin.routes.ts` | `A01`, `A02`, `A03`, `A04` |
| **FR15b**| `tier.repository.ts` | `admin.service.ts` | `admin.routes.ts` | `A08` |
