// ============================================================================
// File: frontend/src/pages/public/P05_RegisterPage.tsx
// Mã màn hình: P05 | Route: /register | FR: FR1
// Vai trò: Trang đăng ký tài khoản khách hàng chuẩn phong cách kiến trúc AUREN:
//          - Biểu mẫu thu thập: Họ tên, Email, Mật khẩu, Số điện thoại, Địa chỉ, Thành phố
//          - Tích hợp gọi API POST /api/auth/register qua AuthContext
//          - Bắt lỗi trùng email (DUPLICATE_EMAIL), lỗi định dạng (VALIDATION_ERROR)
//          - Tuân thủ Modern Web Guidance: autofill-sign-up-form, validate-input-after-interaction
//          - Tự động gán hạng thành viên khởi đầu (Classic) và điều hướng vào hệ thống
// ============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import type { RegisterRequest } from '../../types';

export interface P05_RegisterPageProps {
  readonly initialEmail?: string;
}

export const P05_RegisterPage: React.FC<P05_RegisterPageProps> = ({ initialEmail = '' }) => {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: '',
    email: initialEmail,
    password: '',
    phone: '',
    address: '',
    city: '',
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Nếu đã đăng nhập thì điều hướng về trang cá nhân
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/account/orders', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errorMessage) setErrorMessage(null);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'Họ tên phải có ít nhất 2 ký tự.';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Mật khẩu phải chứa ít nhất 8 ký tự.';
    }
    if (!agreeTerms) {
      errors.terms = 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateClient()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Chỉ gửi các trường có giá trị
      const payload: RegisterRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
      };

      await register(payload);
      navigate('/account/orders', { replace: true });
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          data?: {
            error?: {
              code?: string;
              message?: string;
              details?: Array<{ field?: string; message: string }>;
            };
          };
        };
      };

      const code = errorObj.response?.data?.error?.code;
      const message = errorObj.response?.data?.error?.message;
      const details = errorObj.response?.data?.error?.details;

      if (code === 'DUPLICATE_EMAIL' || errorObj.response?.status === 409) {
        setErrorMessage('Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.');
        setFieldErrors((prev) => ({ ...prev, email: 'Email đã tồn tại' }));
      } else if (code === 'VALIDATION_ERROR' && details) {
        const newFieldErrors: Record<string, string> = {};
        details.forEach((d) => {
          if (d.field) newFieldErrors[d.field] = d.message;
        });
        setFieldErrors(newFieldErrors);
        setErrorMessage('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường báo đỏ.');
      } else if (message) {
        setErrorMessage(message);
      } else {
        setErrorMessage('Không thể đăng ký lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] pt-20 flex items-stretch bg-[#FCF9F3]">
      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-5rem)]">
        {/* Left Side: Membership Benefits & Craft Presentation (4 cols - Desktop only) */}
        <div className="hidden lg:flex lg:col-span-4 relative bg-[#503625] text-[#FAF8F3] p-12 flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <Link
              to="/"
              className="font-serif text-2xl tracking-[0.2em] uppercase text-[#FAF8F3] select-none inline-block hover:opacity-80 transition-opacity"
            >
              AUREN
            </Link>
            <div className="mt-8">
              <span className="eyebrow eyebrow-light">Quyền lợi thành viên · Auren Patron</span>
              <h2 className="font-serif text-3xl xl:text-4xl mt-3 leading-snug">
                Đồng hành cùng những tuyệt tác nội thất vượt thời gian.
              </h2>
            </div>

            {/* Privilege List */}
            <div className="mt-10 flex flex-col gap-5 font-sans text-xs text-[#FAF8F3]/85">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FAF8F3]/10 text-[#A7824B] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </span>
                <div>
                  <strong className="text-white block font-semibold mb-0.5">
                    Hạng thành viên tích lũy
                  </strong>
                  Tự động nâng hạng Classic → Silver → Gold → Diamond với mức ưu đãi giảm giá lên tới 15%.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FAF8F3]/10 text-[#A7824B] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </span>
                <div>
                  <strong className="text-white block font-semibold mb-0.5">
                    Đặc quyền Limited Edition
                  </strong>
                  Quyền ưu tiên đặt chỗ và giữ số thứ tự (Serial No.) cho các phiên bản sản xuất giới hạn.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FAF8F3]/10 text-[#A7824B] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </span>
                <div>
                  <strong className="text-white block font-semibold mb-0.5">
                    Hỗ trợ Quản gia riêng
                  </strong>
                  Nhận tư vấn chọn chất liệu mẫu thực tế và đặt lịch riêng tại hệ thống Showroom.
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-[#FAF8F3]/15 flex items-center gap-2 text-[11px] text-[#FAF8F3]/60">
            <Sparkles className="w-4 h-4 text-[#A7824B]" />
            <span>Kích hoạt tự động ngay sau khi đăng ký</span>
          </div>
        </div>

        {/* Right Side: Form Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-20 py-12 lg:py-16">
          <div className="max-w-xl w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <span className="eyebrow">Tạo tài khoản khách hàng · FR1</span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#0D0703] mt-2">
                Đăng ký thành viên
              </h1>
              <p className="font-sans text-xs text-[#7B6E64] mt-2 leading-relaxed">
                Hoàn tất thông tin cá nhân bên dưới để khởi tạo tài khoản và kích hoạt hồ sơ thành viên.
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate={false}>
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="reg-fullName"
                    className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                  >
                    Họ và tên <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    id="reg-fullName"
                    name="fullName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="auren-input"
                  />
                  {fieldErrors.fullName && (
                    <span className="font-sans text-[10px] text-[#BA1A1A]">
                      {fieldErrors.fullName}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="reg-email"
                    className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                  >
                    Địa chỉ Email <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    maxLength={150}
                    autoComplete="email"
                    placeholder="name@domain.vn"
                    value={formData.email}
                    onChange={handleChange}
                    className="auren-input"
                  />
                  {fieldErrors.email && (
                    <span className="font-sans text-[10px] text-[#BA1A1A]">
                      {fieldErrors.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Password with rules hint */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="reg-password"
                    className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                  >
                    Mật khẩu bảo mật <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <span className="font-sans text-[10px] text-[#7B6E64]">Tối thiểu 8 ký tự</span>
                </div>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
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
                {fieldErrors.password && (
                  <span className="font-sans text-[10px] text-[#BA1A1A]">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Row 3: Phone & City (Optional delivery snapshot helpers) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="reg-phone"
                    className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                  >
                    Số điện thoại liên hệ
                  </label>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    autoComplete="tel"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="auren-input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="reg-city"
                    className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                  >
                    Tỉnh / Thành phố
                  </label>
                  <input
                    id="reg-city"
                    name="city"
                    type="text"
                    maxLength={80}
                    autoComplete="address-level2"
                    placeholder="TP. Hồ Chí Minh"
                    value={formData.city}
                    onChange={handleChange}
                    className="auren-input"
                  />
                </div>
              </div>

              {/* Row 4: Address */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="reg-address"
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#372A22]"
                >
                  Địa chỉ giao hàng dự kiến
                </label>
                <input
                  id="reg-address"
                  name="address"
                  type="text"
                  maxLength={255}
                  autoComplete="street-address"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                  value={formData.address}
                  onChange={handleChange}
                  className="auren-input"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  id="reg-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 accent-[#271E18] cursor-pointer"
                />
                <label htmlFor="reg-terms" className="font-sans text-[11px] text-[#7B6E64] cursor-pointer">
                  Tôi đồng ý với{' '}
                  <span className="text-[#0D0703] underline">Điều khoản dịch vụ</span> và{' '}
                  <span className="text-[#0D0703] underline">Chính sách bảo mật</span> của AUREN Studio.
                </label>
              </div>
              {fieldErrors.terms && (
                <span className="font-sans text-[10px] text-[#BA1A1A] -mt-4">
                  {fieldErrors.terms}
                </span>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-auren-solid w-full mt-2 py-3.5 text-xs tracking-[0.18em]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#FAF8F3] border-t-transparent animate-spin rounded-full"></span>
                    Đang khởi tạo tài khoản...
                  </span>
                ) : (
                  'Hoàn tất đăng ký thành viên →'
                )}
              </button>
            </form>

            {/* Link to Login (P04) */}
            <div className="mt-8 text-center pt-4 border-t border-[#D2C8BA]/60">
              <p className="font-sans text-xs text-[#7B6E64]">
                Đã có tài khoản tại AUREN?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#0D0703] hover:text-[#503625] underline underline-offset-4 ml-1"
                >
                  Đăng nhập ngay →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
