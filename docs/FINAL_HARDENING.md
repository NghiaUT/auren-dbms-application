# Kiểm tra final hardening

Bản ghi dành cho người review và chạy demo. Source gốc: `6ca0766`; các sửa lỗi
application được commit tại `9e5763d`. Không thay schema, thêm dependency hoặc
sửa report/PDF/LaTeX/slide và số liệu benchmark.

## Các lỗi đã sửa

| Lỗi | Bằng chứng trước sửa | Cách sửa |
| --- | --- | --- |
| Reservation từ chối khi còn hàng | [RAN] Stock 800, 800 attempts: chỉ 100 thành công, còn 700 khả dụng | Atomic conditional UPDATE theo tồn khả dụng; không so version đọc trước hoặc retry |
| Review đồng thời trả sai mã lỗi | [RAN] Service trả ER_DUP_ENTRY; middleware đổi thành 409 chung | Map thành 409 DUPLICATE_REVIEW; test HTTP kiểm 201/409 và một DB row |
| Hai dòng Limited cùng variant dùng chung serial | [RAN] Hai dòng chỉ có một assignment | Đánh dấu reserved ngay sau FOR UPDATE; kiểm affectedRows khi assignment |
| Tạo Limited variant trùng serial của variant khác | [RAN] Hai variant độc lập cùng edition size không tạo được | Serial mới có prefix variantId; giữ nguyên serial đã tồn tại |
| Response đặt hàng thiếu trường frontend cần | [READ] Thiếu thông tin khách và payment dueDate | Bổ sung response; [RAN] kiểm POST/GET parity |
| SQL logger nhận nhầm version bump là optimistic lock | [READ] Classifier không yêu cầu version predicate | Chỉ nhận check+bump là optimistic; [RAN] core regression |

Restock vẫn kiểm optimistic version. Claim, payment và status transition giữ SQL
predicate hiện có. Delivery/cancellation chỉ chạy side effect sau khi transition
thắng, trong cùng transaction. Payment schedule giữ order FOR UPDATE trước khi
đọc các khoản thu.

## Kết quả chạy ngày 13/11/2026

[RAN] Docker Compose project riêng `auren-hardening-20261113`, MySQL **8.0.46**,
Node **20.20.2**. MySQL/API/web healthy; seeder exit 0. API health và catalog qua
web proxy hoạt động. Không xóa volume của stack hiện có.

| Kiểm tra | Kết quả |
| --- | --- |
| Fresh db:setup trên auren_hardening_ci_test | Pass; schema, production indexes và seed |
| Backend typecheck / build | Pass |
| Frontend typecheck / build | Pass; còn cảnh báo JS bundle 1,028.60 kB, gzip 268.13 kB |
| test:smoke | Pass: core, customer, sales, admin và HTTP API |
| test:concurrency | Cả 9 scenario pass |

| Scenario | Kết quả DB cuối cùng |
| --- | --- |
| Stock 800 / 800 attempts | 800 success, 0 failure, reserved 800, available 0; attempt 801 là OUT_OF_STOCK |
| Stock 100 / 800 attempts | 100 success, 700 OUT_OF_STOCK, reserved 100, available 0 |
| Multi-item rollback | Reservation, serial và order/item/payment counts không đổi |
| Claim / payment / final schedule | Mỗi race có một winner; đúng sales owner; tiền và paid_at không ghi hai lần; active final = 1, tổng không vượt order total |
| Delivery | Một winner; physical/reserved stock, serial sold và spending thay đổi một lần |
| Cancel vs claim / production | Một path thắng; state, stock, payments và spending nhất quán |
| Limited / restock | 4/8 allocation thắng với 4 serial riêng; stale restock bị từ chối; cùng version chỉ một restock thắng |
| Limited nhiều dòng / tạo variant | Mỗi dòng có serial riêng; hai variant mới không trùng serial |
| Review qua HTTP | 201/409 DUPLICATE_REVIEW; DB có đúng một review |

Suite chỉ chạy với NODE_ENV=test và DB_NAME kết thúc _test. Mỗi scenario có
fixture riêng, cleanup và watchdog 120 giây. Không có assertion về throughput.
[RAN] Hai cấu hình DB không an toàn đều bị guard từ chối trước khi truy cập DB.
CI chạy đủ suite, không cho chọn riêng scenario qua CONCURRENCY_SCENARIO.

## Phạm vi audit

[READ] Đã đối chiếu backend routes/controllers, frontend API/types, App.tsx và
screen inventory. Sửa response đặt hàng và docs sai về FR5, FR11, review-delete;
xóa bốn Admin skeleton chỉ có comment và không có caller. Catalog sort được API
client chuyển đổi đúng; các page thực tế giữ role guard.

[READ] Các mutation trong service transaction truyền conn xuống repository.
Prepared statements, ownership, RBAC, giá phía server, FK/UNIQUE/CHECK và indexes
được giữ nguyên. Order history dùng hai bảng aggregate riêng để tránh JOIN fan-out.
[RAN] Smoke kiểm server pricing, quantity, quyền truy cập, safe delete, reports,
tier recalculation và review moderation. Không có core TODO/placeholder thực thi
nào được tìm thấy trong lần rà này.

## Chạy lại

Trên Windows, chạy [ensure-docker](DOCKER_WINDOWS.md) trước các lệnh Docker.
Dùng project/schema test riêng, không reset database demo:

```sh
docker --context desktop-linux compose -p auren-hardening-20261113 exec -T \
  -e NODE_ENV=test -e DB_NAME=auren_repeat_test -e SQL_LOG=off -e CI=true api \
  sh -c 'npm run db:setup && npm run typecheck && npm run build && npm run test:all'
docker --context desktop-linux compose -p auren-hardening-20261113 exec -T web \
  sh -c 'npm run typecheck && npm run build'
```

Chọn tên schema mới nếu cần seed sạch. Log lần chạy local nằm trong thư mục
ignored `backend/node_modules/.cache/final-hardening/`: `docker-backend.log`,
`docker-frontend.log`, `docker-startup.log`; log baseline và MySQL 8.4 cũng được giữ.
CI dùng Node 20/MySQL 8.0 và thêm bước concurrency bắt buộc sau smoke.

## Giới hạn

Các test kiểm những race nêu trên, không bao phủ mọi interleaving. Tier preview
counts có thể khác snapshot sau đó khi có mutation đồng thời; chưa có test riêng
cho tier/delivery interleaving. Bundle warning chưa xử lý. Kết quả local không
thay thế kết quả GitHub Actions trên commit được push.
