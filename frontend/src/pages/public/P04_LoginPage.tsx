// ============================================================================
// File: frontend/src/pages/public/P04_LoginPage.tsx
// Mã màn hình: P04 | Route: /login | FR: FR0
// Vai trò: Trang đăng nhập hệ thống chuẩn phong cách kiến trúc AUREN:
//          - Bố cục chia đôi (Editorial Split Layout) với hình ảnh chế tác bên trái
//          - Biểu mẫu đăng nhập nhập liệu đường kẻ đáy (Single horizontal rule)
//          - Tích hợp gọi API POST /api/auth/login thông qua AuthContext
//          - Điều hướng theo phân quyền (Role-based redirect):
//              * customer -> /account/orders (hoặc trang trước đó)
//              * sales    -> /sales
//              * admin    -> /admin
//          - Thẻ điền nhanh tài khoản demo (Quick Demo Credentials)
// ============================================================================

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import {
  extractRedirectTarget,
  getDefaultRouteForRole,
  isRouteAllowedForRole,
} from '../../auth/authUtils';
import type { LoginRequest, UserRole } from '../../types';

export interface P04_LoginPageProps {
  readonly defaultEmail?: string;
}

export const P04_LoginPage: React.FC<P04_LoginPageProps> = ({ defaultEmail = '' }) => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<LoginRequest>({
    email: defaultEmail,
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Điều hướng người dùng theo role & kiểm tra quyền hạn của trang trước đó
  const redirectAfterLogin = (role: UserRole) => {
    const targetPath = extractRedirectTarget(location.state, location.search);

    if (targetPath && isRouteAllowedForRole(targetPath, role)) {
      navigate(targetPath, { replace: true });
      return;
    }

    // Nếu không có URL hợp lệ hoặc role không được phép truy cập targetPath,
    // điều hướng về bảng điều khiển mặc định theo vai trò (ngăn chặn tuyệt đối 403)
    navigate(getDefaultRouteForRole(role), { replace: true });
  };

  // Nếu đã đăng nhập sẵn thì chuyển trang ngay
  React.useEffect(() => {
    if (isAuthenticated && user) {
      redirectAfterLogin(user.role);
    }
  }, [isAuthenticated, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(formData);
      redirectAfterLogin(loggedInUser.role);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          data?: { error?: { code?: string; message?: string } };
        };
      };

      const code = errorObj.response?.data?.error?.code;
      const message = errorObj.response?.data?.error?.message;

      if (code === 'INVALID_CREDENTIALS' || errorObj.response?.status === 401) {
        setErrorMessage('Email hoặc mật khẩu không chính xác.');
      } else if (code === 'RATE_LIMITED' || errorObj.response?.status === 429) {
        setErrorMessage('Quá nhiều lượt thử đăng nhập. Vui lòng chờ ít phút rồi thử lại.');
      } else if (message) {
        setErrorMessage(message);
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Điền nhanh tài khoản demo
  const fillDemoAccount = (email: string) => {
    setFormData({
      email,
      password: 'password123',
    });
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] pt-20 flex items-stretch bg-[#FCF9F3]">
      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-5rem)]">
        {/* Left Side: Architectural Editorial Photo & Statement (5 cols - Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#271E18] text-[#FAF8F3] p-12 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200&q=85&auto=format&fit=crop"
              alt="AUREN Lounge Chair in architectural atelier setting"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#271E18] via-[#271E18]/60 to-[#271E18]/40"></div>
          </div>

          <div className="relative z-10">
            <Link
              to="/"
              className="font-serif text-2xl tracking-[0.2em] uppercase text-[#FAF8F3] select-none inline-block hover:opacity-80 transition-opacity"
            >
              AUREN
            </Link>
            <div className="mt-8">
              <span className="eyebrow eyebrow-light">Cổng thành viên & Quản trị</span>
              <h2 className="font-serif text-3xl xl:text-4xl mt-3 leading-snug">
                Không gian dành riêng cho những trải nghiệm bền vững.
              </h2>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-[#FAF8F3]/15">
            <blockquote className="font-sans text-xs text-[#FAF8F3]/70 italic leading-relaxed">
              "Sự tĩnh tại trong kiến trúc không đến từ việc loại bỏ tất cả, mà đến từ việc chỉ giữ lại
              những gì thực sự có linh hồn."
            </blockquote>
            <p className="font-sans text-[10px] text-[#A7824B] uppercase tracking-widest mt-2 font-semibold">
              — AUREN Atelier Stockholm
            </p>
          </div>
        </div>

        {/* Right Side: Form Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20 py-12 lg:py-16">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <span className="eyebrow">Xác thực hệ thống · FR0</span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#0D0703] mt-2">
                Đăng nhập AUREN
              </h1>
              <p className="font-sans text-xs text-[#7B6E64] mt-2 leading-relaxed">
                Quản lý các tác phẩm đã đặt, kiểm tra lịch thanh toán và tận hưởng đặc quyền thành viên.
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 p-4 bg-[#BA1A1A]/10 border-l-2 border-[#BA1A1A] rounded-[2px] flex items-start gap-3"
              >
                <ShieldAlert className="w-4 h-4 text-[#BA1A1A] shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-[#BA1A1A] leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Form (Adheres to Modern Web Guidance: autofill-sign-in-form & validate-input-after-interaction) */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate={false}>
              {/* Field 1: Email */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="login-email"
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="none"
                    placeholder="name@domain.vn"
                    value={formData.email}
                    onChange={handleChange}
                    className="auren-input pr-8"
                  />
                  <Mail className="absolute right-1 top-3.5 w-4 h-4 text-[#7B6E64]/60 pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                  >
                    Mật khẩu
                  </label>
                  <span className="font-sans text-[10px] text-[#7B6E64] hover:text-[#0D0703] cursor-pointer">
                    Quên mật khẩu?
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="auren-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-1 top-3 text-[#7B6E64] hover:text-[#0D0703] p-1 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 stroke-[1.5]" />
                    ) : (
                      <Eye className="w-4 h-4 stroke-[1.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-auren-solid w-full mt-2 py-3.5 text-xs tracking-[0.18em]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#FAF8F3] border-t-transparent animate-spin rounded-full"></span>
                    Đang xác thực...
                  </span>
                ) : (
                  'Đăng nhập vào hệ thống →'
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Widget */}
            <div className="mt-8 pt-6 border-t border-[#D2C8BA]/60">
              <span className="eyebrow text-[9px] mb-3">Tài khoản demo có sẵn trong CSDL (Nhấn để điền):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('customer.silver@gmail.com')}
                  className="p-2.5 bg-[#FAF8F3] hover:bg-[#F0EEE8] border border-[#D2C8BA]/60 rounded-[2px] text-left transition-colors"
                >
                  <p className="font-sans text-[10px] font-bold text-[#0D0703] uppercase">Khách hàng</p>
                  <p className="font-mono text-[9px] text-[#7B6E64] truncate">customer.silver@gmail.com</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoAccount('sales.nam@luxury.com')}
                  className="p-2.5 bg-[#FAF8F3] hover:bg-[#F0EEE8] border border-[#D2C8BA]/60 rounded-[2px] text-left transition-colors"
                >
                  <p className="font-sans text-[10px] font-bold text-[#0D0703] uppercase">Nhân viên Sales</p>
                  <p className="font-mono text-[9px] text-[#7B6E64] truncate">sales.nam@luxury.com</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin@luxury.com')}
                  className="p-2.5 bg-[#FAF8F3] hover:bg-[#F0EEE8] border border-[#D2C8BA]/60 rounded-[2px] text-left transition-colors"
                >
                  <p className="font-sans text-[10px] font-bold text-[#0D0703] uppercase">Quản trị viên</p>
                  <p className="font-mono text-[9px] text-[#7B6E64] truncate">admin@luxury.com</p>
                </button>
              </div>
            </div>

            {/* Link to Register (P05) */}
            <div className="mt-8 text-center pt-4">
              <p className="font-sans text-xs text-[#7B6E64]">
                Bạn là khách hàng mới?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-[#0D0703] hover:text-[#503625] underline underline-offset-4 ml-1"
                >
                  Đăng ký thành viên AUREN →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
