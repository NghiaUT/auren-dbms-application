# WORK_BREAKDOWN - Phân công công việc

## 1. Nguyên tắc chia việc

1. **Chia theo lát cắt dọc (vertical slice)**: mỗi người sở hữu một cụm FR từ SQL → service → API → màn hình. Cách này giảm phụ thuộc, vì không ai phải chờ "người làm backend" hay "người làm frontend".
2. **Mỗi người một topic DBMS**: đề yêu cầu số topic bằng số thành viên và mỗi người nghiên cứu ít nhất một topic, so sánh MySQL với NoSQL (dùng **MongoDB**). Topic của mỗi người gắn với FR mình làm, nên demo lấy thẳng từ code của mình.
3. **Một người sở hữu một file**: mỗi file repository/service/controller/page có đúng một chủ. Người khác muốn sửa phải qua PR hoặc nhờ chủ file.
4. **Nền tảng đi trước**: thành viên 1 giao khung dự án sớm (Giai đoạn 1) để các thành viên còn lại không bị chặn.

Bảng dưới giả định **nhóm 5 người** (n = 2×5 = 10 FR, kế hoạch có 15 FR nên dư an toàn). Ghi chú nhóm 4 người ở mục 8.

---

## 2. Tổng quan phân công

| TV      | Vai trò                                  | FR phụ trách                                | Màn hình                              | Topic DBMS                                                        |
| ------- | ---------------------------------------- | ------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| **TV1** | Trưởng nhóm, nền tảng, Auth              | FR0, FR1, hồ sơ cá nhân, quản lý người dùng | P04, P05, C08, A09, layout dùng chung | **Data storage & management** (+ **Backup & Recovery** làm bonus) |
| **TV2** | Catalog công khai và đánh giá            | FR2, FR3, FR4, FR10                         | P01, P02, P03, C07, A10               | **Indexing**                                                      |
| **TV3** | Đặt hàng và thanh toán của khách         | FR5, FR7, FR8, FR9                          | C01, C02, C04 (kèm modal), C05               | **Transaction**                                                   |
| **TV4** | Limited Edition và nghiệp vụ Sales       | FR6, FR7b, FR11, FR12, FR13                 | C03, S01-S07                          | **Concurrency control**                                           |
| **TV5** | Admin: catalog, báo cáo, hạng thành viên | FR14, FR15a, FR15b                          | A01-A10                               | **Query processing**                                              |

Số FR: TV1 = 2 (cộng nền tảng nặng), TV2 = 4, TV3 = 4, TV4 = 5, TV5 = 3. Tổng 18 đầu việc, tương ứng 15 FR + FR0 + FR7b + hồ sơ.

---

## 3. Quyền sở hữu file

| Khu vực                                                                          | Chủ                                 | Ghi chú                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `database/schema.sql`, `database/indexes.sql`                                    | TV1 (schema), TV2 (indexes)         | Sửa schema phải báo cả nhóm                                      |
| `backend/src/scripts/seed.ts`, `backend/src/scripts/seed-large.ts`                                             | TV1                                 | Các thành viên gửi yêu cầu dữ liệu mẫu cho TV1                   |
| `backend/src/app.ts`, `config/*`, `middlewares/*`, `utils/*`                     | TV1                                 |                                                                  |
| `frontend/src/api/client`, `auth/*`, `layouts/*`, `components/*` dùng chung      | TV1                                 | Component riêng của màn hình do chủ màn hình giữ                 |
| `routes/controllers/services` theo `*.routes/*.service`                          | Theo cột FR ở mục 2                 | Ví dụ `order.service.ts` thuộc TV3, `sales.service.ts` thuộc TV4 |
| `repository/user.repository.ts`, `customer.repository.ts`                        | TV1                                 |                                                                  |
| `repository/catalog.repository.ts`, `review.repository.ts`                       | TV2                                 |                                                                  |
| `repository/order.repository.ts`, `payment.repository.ts`                        | TV3                                 | TV4 thêm hàm (claim, lập lịch thanh toán) qua PR vào file này    |
| `repository/inventory.repository.ts`, `edition.repository.ts`                    | TV4                                 | TV3 gọi `reserveStock` từ file này                               |
| `repository/variant.repository.ts`, `tier.repository.ts`, `report.repository.ts` | TV5                                 | TV2 và TV3 đọc `variant.repository` qua hàm đã công bố           |
| `docs/API_CONTRACT.md`                                                           | Chủ endpoint cập nhật phần của mình | Đổi cần PR `contract-change`                                     |

**Điểm giao nhau cần thống nhất sớm** (làm ở Giai đoạn 0):

| Giao điểm                          | Bên liên quan  | Thoả thuận                                                                                                                                                      |
| ---------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeOrder` gọi `reserveStockIfAvailable`    | TV3 ↔ TV4      | Chữ ký: `reserveStockIfAvailable(variantId, locationId, qty, conn)` trả `affectedRows`. TV4 giao hàm này ở Giai đoạn 2 đầu tiên, TV3 dùng bản giả (stub) trước đó |
| Huỷ đơn có serial Limited          | TV3 ↔ TV4      | TV4 cung cấp `releaseUnitsByOrderId(orderId, conn)` trong `edition.repository.ts`                                                                       |
| Cộng `total_spent` khi `delivered` | TV4 ↔ TV1      | `customer.repository.addSpent(customerId, amount, conn)` do TV1 viết, TV4 gọi trong `sales.service`                                                             |
| Đọc biến thể để tính giá           | TV3, TV4 ↔ TV5 | `variant.repository.findActiveById(id, conn)` do TV5 viết sớm                                                                                                   |
| Giảm giá theo hạng                 | TV3 ↔ TV1      | `customer.repository.findWithTierByUserId(userId, conn)` do TV1 viết                                                                                            |

---

## 4. Danh sách việc chi tiết

Đánh dấu `[ ]` khi xong. Mỗi mục "xong" phải thoả **Definition of Done** trong `CONVENTIONS.md`.

### TV1 - Nền tảng, Auth, Storage

**Giai đoạn 1 (giao sớm, ưu tiên cao nhất)**

- [x] Khởi tạo repo, cấu trúc thư mục, ESLint/Prettier, `.env.example`
- [] `docker-compose.yml` (mysql, api, web), nạp `schema.sql`
- [x] Backend: `db.ts` (pool, `withTransaction`), `authenticate`, `authorize`, `validate`, `errorHandler`, `AppError`, `sendSuccessRes()`
- [ ] Frontend: Vite + Router, axios client (gắn token, bắt `TOKEN_EXPIRED`), `AuthContext`, `ProtectedRoute`, 4 layout, `StatusBadge`, `DataTable`, `Toast`, `ConfirmDialog`
- [ ] `seed.sql`: tài khoản demo (xem `ROLE_MATRIX.md` mục 6), danh mục, thương hiệu, vài sản phẩm, kho, hạng thành viên
- [ ] Hàm dùng chung: `customer.repository` (findWithTierByUserId, addSpent)

**Giai đoạn 2**

- [ ] FR0, FR1: `auth.*`, màn P04, P05
- [ ] Hồ sơ C08, quản lý người dùng A09
- [ ] `backend/src/scripts/seed-large.ts` (10k-100k đơn có phân bố thực tế)

**Topic: Data storage & management**

- [ ] MySQL: kiểu dữ liệu, ràng buộc (FK, CHECK), cột JSON `customization`
- [ ] MongoDB: mô hình tài liệu, nhúng `order_items` vào `orders`, nhúng `variants` vào `products`
- [ ] Bảng so sánh: chuẩn hoá và nhúng, toàn vẹn dữ liệu, truy vấn JSON
- [ ] Bonus Backup & Recovery: `mysqldump` + `mysqlbinlog` (khôi phục theo thời điểm) và `mongodump`/`mongorestore`

### TV2 - Catalog và Review, Indexing

- [ ] Backend: `catalog.service/controller/routes`, `catalog.repository`, `review.*`
- [ ] FR2, FR3: lọc nhiều điều kiện, phân trang, `sort` whitelist
- [ ] FR4: chi tiết sản phẩm gom biến thể, chất liệu, tồn kho (tránh N+1: một truy vấn JOIN rồi gom ở service)
- [ ] FR10: tạo/xoá đánh giá (truy vấn `INSERT ... SELECT`), liệt kê đánh giá
- [ ] Frontend: P01, P02, P03, C07, A10
- [ ] `indexes.sql`: rà lại, hoàn thiện kịch bản `EXPLAIN` trước/sau

**Topic: Indexing**

- [ ] MySQL: B-Tree đơn và composite, covering index, thứ tự cột, `LIKE 'x%'` và `LIKE '%x%'`, FULLTEXT
- [ ] MongoDB: single, compound, text index, `explain("executionStats")`
- [ ] Đo thời gian và `rows examined` trên dữ liệu 100k, vẽ biểu đồ so sánh

### TV3 - Đơn hàng và thanh toán của khách, Transaction

- [ ] Backend: `order.service/controller/routes` (phần khách), `order.repository`, `payment.repository` (phần trả tiền), `payment.service`
- [ ] FR5: `placeOrder` trong transaction, giảm giá theo hạng, tính tiền phía server
- [ ] FR8: lịch sử đơn, chi tiết đơn, lịch thanh toán
- [ ] FR9: huỷ đơn trong transaction (trả tồn, giải phóng serial, đổi trạng thái)
- [ ] FR7: khách trả khoản (`UPDATE ... WHERE status = 'pending'`)
- [ ] Frontend: C01 (giỏ hàng, lưu `localStorage`), C02, C04 (kèm modal), C05
- [ ] Test Supertest: rollback khi một dòng hàng lỗi

**Topic: Transaction**

- [ ] MySQL: ACID, `START TRANSACTION`/`COMMIT`/`ROLLBACK`, savepoint, các mức cô lập, demo dirty/non-repeatable/phantom read
- [ ] MongoDB: transaction đa tài liệu (yêu cầu replica set), so sánh chi phí và giới hạn
- [ ] Demo: đặt đơn 3 dòng, dòng thứ 3 hết hàng, chứng minh toàn bộ rollback

### TV4 - Limited Edition và Sales, Concurrency

- [ ] Backend: `inventory.repository`, `edition.repository`, `sales.service/controller/routes`, phần Limited của `order.service`
- [ ] FR6: `SELECT ... FOR UPDATE`, cấp serial
- [ ] FR11: nhận đơn (chống hai Sales cùng nhận), đổi trạng thái theo bảng chuyển hợp lệ, khi `delivered` cộng `total_spent`
- [ ] FR12: xem tồn, cảnh báo sắp hết (subquery), nhập kho với `version`
- [ ] FR13: công nợ quá hạn, `mark-overdue`
- [ ] FR7b: lập lịch thanh toán, kiểm tổng bằng `total`
- [ ] Frontend: C03, S01-S07
- [x] `backend/src/scripts/test-sales.ts`: nhận đơn, trả tiền, hủy và bàn giao đồng thời

**Topic: Concurrency control**

- [ ] MySQL: khoá hàng (`FOR UPDATE`, `FOR SHARE`), optimistic (`version`), deadlock và cách tránh, `SHOW ENGINE INNODB STATUS`
- [ ] MongoDB: `findOneAndUpdate` nguyên tử, version field, so sánh với khoá của MySQL
- [ ] Demo: 2 phiên MySQL cùng mua chiếc cuối (có và không có khoá), tái hiện deadlock rồi sửa

### TV5 - Admin, Query processing

- [ ] Backend: `admin.service/controller/routes`, `variant.repository`, `tier.repository`, `report.repository`
- [ ] FR14: CRUD sản phẩm, biến thể, chất liệu, danh mục, thương hiệu, kho, serial Limited. Xoá biến thể bằng `NOT EXISTS`
- [ ] FR15a: bốn báo cáo (doanh thu theo tháng, doanh số thương hiệu có HAVING, điểm đánh giá, khách trên trung bình)
- [ ] FR15b: CRUD hạng, nâng hạng tự động (`UPDATE` + subquery)
- [ ] Frontend: A01-A10 (biểu đồ Recharts)
- [ ] Viết sớm `variant.repository.findActiveById` cho TV3, TV4

**Topic: Query processing**

- [ ] MySQL: `EXPLAIN`/`EXPLAIN ANALYZE`, thứ tự JOIN, so sánh subquery và JOIN, tối ưu hoá truy vấn báo cáo, `GROUP BY` + `HAVING`
- [ ] MongoDB: aggregation pipeline (`$lookup`, `$group`), `explain`, so sánh với SQL JOIN
- [ ] Viết lại 2 truy vấn chậm (subquery → JOIN) và đo cải thiện

---

## 5. Kế hoạch theo giai đoạn

Đề ghi hạn nộp tuần 47-50. Bảng dùng mốc tương đối, nhóm quy đổi theo hạn thực tế của giảng viên.

| Giai đoạn                 | Thời lượng gợi ý                     | Mục tiêu                                                                                           | Ai làm                                                           | Cổng kiểm tra (gate)                                      |
| ------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| **0. Khởi động**          | 2-3 ngày                             | Thống nhất contract, quyền sở hữu file, điểm giao nhau (mục 3). Mỗi người đọc `ARCHITECTURE.md`    | Cả nhóm                                                          | Cả nhóm approve `API_CONTRACT.md`. Họp lần 1, có biên bản |
| **1. Nền tảng**           | ~1 tuần                              | Khung backend/frontend, docker, seed nhỏ. Các thành viên khác viết repository và mock FE song song | TV1 chính, các TV khác viết SQL repository và màn hình bằng mock | `docker compose up` chạy được, đăng nhập được 3 role      |
| **2. Phát triển FR**      | ~1,5-2 tuần                          | Làm hết FR của mình, tích hợp từng endpoint với FE thật                                            | Mỗi TV                                                           | Mỗi FR qua DoD. Họp tuần, review PR chéo                  |
| **3. Tích hợp**           | ~3-4 ngày                            | Chạy trọn luồng: đặt hàng → Sales xử lý → thanh toán → giao → đánh giá. Sửa lỗi liên module        | Cả nhóm                                                          | Kịch bản demo ở mục 6 chạy trót lọt hai lần liên tiếp     |
| **4. Demo DBMS**          | ~1 tuần (chạy **song song** với 2-3) | Mỗi TV hoàn thiện demo topic trên MySQL và MongoDB, thu số liệu                                    | Mỗi TV                                                           | Mỗi topic có script chạy lại được và bảng so sánh         |
| **5. Báo cáo, trình bày** | ~1 tuần                              | Viết báo cáo, tập thuyết trình, đóng gói zip                                                       | Cả nhóm                                                          | Zip nộp, rehearsal có bấm giờ                             |

<!-- Phần demo DBMS (Giai đoạn 4) phụ thuộc dữ liệu lớn của `backend/src/scripts/seed-large.ts`, nên **TV1 phải xong `backend/src/scripts/seed-large.ts` ngay đầu Giai đoạn 2**. -->

---

## 6. Kịch bản demo tích hợp (kiểm tra ở Giai đoạn 3)

1. Guest tìm sofa da, lọc theo giá, xem chi tiết (FR2-FR4).
2. Đăng ký tài khoản mới (FR1), đăng nhập, đặt hàng một sofa tuỳ chỉnh (FR5).
3. `sales1` nhận đơn, lập lịch cọc và thanh toán cuối, chuyển `in_production` (FR11, FR7b).
4. Khách trả cọc (FR7).
5. Hai khách (`racer1`, `racer2`) cùng bấm mua chiếc Limited cuối, chỉ một người thành công (FR6).
6. `sales1` giao hàng: `shipped` → `delivered`, `total_spent` tăng (FR11).
7. Khách đánh giá sản phẩm (FR10).
8. Admin xem báo cáo, nâng hạng tự động, thêm biến thể mới (FR14, FR15).
9. Khách huỷ một đơn `pending` khác, tồn kho hoàn lại (FR9).

Kịch bản này phủ cả tám loại query: Insert, Delete, Update, điều kiện đơn, điều kiện phức hợp, Join, Subquery, Aggregate.

---

## 7. Cấu trúc báo cáo và người phụ trách

Rubric chấm cấu trúc báo cáo từ 4 đến 7 mục, bắt buộc có Giới thiệu, Kết luận kèm tự đánh giá và Tài liệu tham khảo. Cấu trúc đề xuất vừa đúng **7 mục**:

| Mục | Nội dung                                                                                                                                                                    | Người viết chính             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | Giới thiệu dự án (bối cảnh, mục tiêu, phạm vi)                                                                                                                              | TV1                          |
| 2   | Phân tích và thiết kế (ERD, FR, role, danh sách màn hình, ma trận phân quyền)                                                                                               | TV5                          |
| 3   | Kiến trúc và hiện thực ứng dụng (kiến trúc, công nghệ, 8 loại query gắn FR)                                                                                                 | TV3                          |
| 4   | Các chủ đề DBMS: demo và so sánh MySQL với MongoDB (4.1 Storage, 4.2 Indexing, 4.3 Transaction, 4.4 Concurrency, 4.5 Query processing, 4.6 Backup & Recovery nếu làm bonus) | Mỗi TV tự viết mục của mình  |
| 5   | Phân công và báo cáo teamwork (bảng đóng góp, biên bản họp đính kèm)                                                                                                        | TV1                          |
| 6   | Kết luận và tự đánh giá (mỗi TV viết đoạn của mình, DBMS nào phù hợp bối cảnh)                                                                                              | TV4 tổng hợp                 |
| 7   | Tài liệu tham khảo (trích dẫn nguồn khi dùng lại tài liệu)                                                                                                                  | Mỗi TV bổ sung, TV2 tổng hợp |

Mỗi thành viên **thuyết trình phần của mình** (FR + topic), nên bảng phân công ở mục 2 cũng là kịch bản chia phần trình bày.

---

## 8. Điều chỉnh theo quy mô nhóm

- **Nhóm 4 người (n = 8)**: gộp việc TV5 vào TV2 và TV3: TV2 nhận FR14 (CRUD catalog), TV3 nhận FR15a/b (báo cáo, hạng). Topic Query processing chuyển cho TV3. Vẫn còn 15 FR, vượt mức n = 8.
- **Giảm khối lượng nếu thiếu thời gian** (theo thứ tự cắt đầu tiên): A09 và A10, FR15b, FR13, FR10, FR7b. Vẫn giữ được ≥ 10 FR và đủ 8 loại query.
- **Topic bonus** (Backup & Recovery) chỉ bắt đầu khi bốn topic còn lại đã có số liệu.

---

<!-- ## 9. Nhật ký teamwork (đính kèm báo cáo)

### 9.1 Bảng đóng góp

| Thành viên | MSSV | Công việc đã làm | Commit / PR chính | Tỉ lệ đóng góp |
| ---------- | ---- | ---------------- | ----------------- | -------------- |
|            |      |                  |                   |                |

### 9.2 Mẫu biên bản họp (tạo mỗi cuộc họp, lưu ở `docs/minutes/YYYY-MM-DD.md`)

```
# Biên bản họp nhóm - <ngày giờ>
Địa điểm/hình thức: ...
Người ghi biên bản: ...
Thành viên tham dự: ... | Vắng: ... (lý do)

## 1. Nội dung đã làm từ lần họp trước
- TVx: ...

## 2. Vấn đề, khó khăn, quyết định
| Vấn đề | Quyết định | Người chịu trách nhiệm | Hạn |
|---|---|---|---|

## 3. Công việc cho giai đoạn tới
- [ ] TVx: ... (hạn ...)

## 4. Ghi chú khác
```

Tối thiểu 1 biên bản (rubric yêu cầu), thực tế nên có biên bản cho họp khởi động (Giai đoạn 0), họp tích hợp (Giai đoạn 3) và họp trước khi nộp. -->
