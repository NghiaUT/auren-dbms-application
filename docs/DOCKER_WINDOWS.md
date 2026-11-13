# Khởi động Docker Desktop trên Windows

Chạy `scripts/ensure-docker.ps1` trong PowerShell của người dùng đang đăng nhập,
không dùng **Run as administrator**. Script kiểm Docker Engine qua context
`desktop-linux`; chỉ khi Engine chưa sẵn sàng mới gọi CLI chính thức
`docker desktop start --detach` một lần. Script kiểm lại trong tối đa 180 giây
và chỉ trả exit 0 khi `docker info` thành công.

## Cài đặt và sử dụng

Máy kiểm tra không có ổ D:, nên dùng `C:\DockerTools` theo lựa chọn của người dùng.
Đây chỉ là vị trí script/log, không phải vị trí Docker data. Có thể đổi thư mục
log bằng `-LogDirectory`; không cần chuyển Docker data hoặc tạo drive mapping.

```powershell
$tools = 'C:\DockerTools'
New-Item -ItemType Directory -Path "$tools\logs" -Force | Out-Null
Copy-Item .\scripts\ensure-docker.ps1 "$tools\ensure-docker.ps1"

& "$tools\ensure-docker.ps1" -LogDirectory "$tools\logs"
if ($LASTEXITCODE -ne 0) { throw 'Docker Engine chưa sẵn sàng; xem log.' }
docker --context desktop-linux compose up -d
```

Chạy script trước các lệnh Docker. Có thể dùng trực tiếp bản trong repository
và chỉ định `-LogDirectory` đến thư mục được phép ghi. Mỗi lần chạy tạo một log
có timestamp; `START_REQUEST` là yêu cầu khởi động, `ENGINE_READY` là xác nhận
Engine hoạt động. GUI hoặc tiến trình xuất hiện chưa đủ để kết luận thành công.
Script có mutex để hai lần gọi đồng thời không tạo hai yêu cầu khởi động.

## Khi chạy từ Codex

Codex sandbox có thể đổi `LOCALAPPDATA` sang `Packages\sandbox...` và chặn named
pipe của Docker. Script từ chối khởi động trong môi trường đó. Cấp quyền chạy
ngoài sandbox trong **phiên Windows thường của cùng người dùng**, hoặc mở Docker
Desktop thủ công rồi kiểm `docker info`. Quyền ngoài sandbox khác với quyền
Administrator; không dùng UAC, `RunAs` hay đổi quyền tài khoản.

## Nếu lỗi dockerInference trở lại

Script chỉ ghi metadata của runtime socket và các dòng lỗi liên quan trong log
backend. Không xóa/đổi tên socket hoặc thư mục, kill process, shutdown WSL, reset,
prune, uninstall hay chỉnh dữ liệu/VHDX.

Để sửa tiếp, cần xác nhận Docker Desktop đã **Quit bình thường**, kiểm socket
`%LOCALAPPDATA%\Docker\run\dockerInference` có còn bị giữ hay là runtime entry
cũ, rồi thống nhất thao tác sửa riêng entry đó. Đây là hướng chẩn đoán, chưa phải
kết luận nguyên nhân hoặc quyền xóa file. Giữ nguyên thư mục data và VHDX.

## Kết quả kiểm tra ngày 13/11/2026

- Windows build `26200.9974` (25H2), WSL `2.6.1.0`, kernel `6.6.87.2-1`;
  Docker Desktop `4.51.0.210443`, Engine `28.5.2`.
- Phiên user thường: session 1, không elevated; `LOCALAPPDATA` đúng thư mục user.
  Sandbox cùng user/session nhưng dùng `LOCALAPPDATA` khác.
- Engine đang chạy: exit 0, không gọi start thêm.
- Sau `docker desktop stop --timeout 45`: một `START_REQUEST`, Engine sẵn sàng
  sau khoảng 23 giây; không tái diễn lỗi Inference manager trong lần thử này.
- Phiên kiểm tra chỉ thấy ổ C:, chưa xác nhận được thông tin Docker data trên D:.
  Các kết quả trên không chứng minh mọi lỗi runtime socket đã được khắc phục.

Tham khảo: [Docker Desktop start](https://docs.docker.com/reference/cli/docker/desktop/start/)
và [stop](https://docs.docker.com/reference/cli/docker/desktop/stop/).
