// ============================================================================
// File: frontend/src/api/axiosClient.js
// Vai trò: Khởi tạo Axios instance dùng chung với baseURL trỏ về Backend API,
//          gắn request interceptor tự động đính kèm header Authorization: Bearer <token>
//          và response interceptor chuẩn hoá xử lý lỗi HTTP (401, 403, 409...).
// ============================================================================
