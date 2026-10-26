// ============================================================================
// File: backend/src/services/auth.service.js
// Vai trò: Tầng Service — Xử lý nghiệp vụ xác thực và hồ sơ khách hàng:
//   - Đăng ký tài khoản mới kèm khởi tạo hồ sơ customer ở hạng mặc định (FR1)
//   - Đăng nhập, băm/so khớp mật khẩu với bcrypt và ký JWT access token (FR0)
//   - Truy vấn và cập nhật thông tin cá nhân kèm tiến độ hạng thành viên
// Quy tắc: Chứa logic nghiệp vụ và quản lý transaction, không viết câu lệnh SQL.
// ============================================================================
