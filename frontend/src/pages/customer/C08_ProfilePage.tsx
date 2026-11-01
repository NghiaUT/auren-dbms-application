// ============================================================================
// File: frontend/src/pages/customer/C08_ProfilePage.tsx
// Mã màn hình: C08 | Route: /account/profile | FR: Bổ sung (Hồ sơ & Hạng thành viên)
// Vai trò: Màn hình Hồ sơ cá nhân & Hạng Patron — Hiển thị huy hiệu danh vị,
//          tổng chi tiêu tích luỹ, thanh tiến độ thăng hạng, bảng quyền lợi đặc quyền,
//          và form cập nhật thông tin giao nhận White-Glove mặc định.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { updateProfileApi } from '../../api/auth.api';
import { formatVND } from '../../utils/formatVND';
import { useToast } from '../../context/ToastContext';

export const C08_ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.customer?.phone || '');
  const [address, setAddress] = useState(user?.customer?.address || '');
  const [city, setCity] = useState(user?.customer?.city || '');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    setFullName(user.fullName || '');
    setPhone(user.customer?.phone || '');
    setAddress(user.customer?.address || '');
    setCity(user.customer?.city || '');
  }, [user]);

  const currentSpent = user?.customer?.totalSpent || 0;
  const currentTier = user?.customer?.tier;
  const nextTier = user?.customer?.nextTier;

  // Tính toán phần trăm tiến độ lên hạng kế tiếp
  const progressPct = nextTier
    ? Math.min(100, Math.max(5, Math.round((currentSpent / nextTier.minSpent) * 100)))
    : 100;

  const remainingToNextTier = nextTier
    ? Math.max(0, nextTier.minSpent - currentSpent)
    : 0;

  // Xử lý lưu thông tin hồ sơ
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateProfileApi({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
      });

      await refreshUser();
      const msg = 'Hồ sơ Patron và địa chỉ bàn giao White-Glove đã được cập nhật thành công.';
      setSuccessMessage(msg);
      toast.success(msg);
    } catch (err: any) {
      console.error('Lỗi khi cập nhật hồ sơ:', err);
      const errMsg = err.response?.data?.error?.message || 'Không thể lưu thay đổi hồ sơ.';
      setErrorMessage(errMsg);
      toast.error(err, errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Quý khách có chắc chắn muốn đăng xuất khỏi phiên hiện tại?')) {
      await logout();
      navigate('/login', { replace: true, state: {} });
    }
  };

  return (
    <div className="w-full pt-28 pb-24 bg-[#FAF8F3] min-h-screen text-[#0D0703]">
      <div className="max-w-5xl mx-auto px-6 md:px-12 space-y-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-sans text-[#7B6E64]">
          <Link to="/" className="hover:text-[#0D0703] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#0D0703] font-medium">Không gian Patron</span>
          <span>/</span>
          <span className="text-[#A58548] font-medium">Hồ sơ cá nhân & Hạng thành viên</span>
        </nav>

        {/* ============================================================ */}
        {/* 1. HEADER DANH TỰ PATRON & HUY HIỆU KIM LOẠI                */}
        {/* ============================================================ */}
        <div className="p-8 bg-[#271E18] text-[#FAF8F3] rounded-[2px] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Họa tiết chìm AUREN */}
          <div className="absolute right-0 bottom-0 text-[180px] font-serif text-white/[0.03] leading-none select-none pointer-events-none">
            A
          </div>

          <div className="flex items-center gap-6 z-10">
            <div className="w-20 h-20 rounded-full bg-[#A58548] text-[#FAF8F3] flex items-center justify-center font-serif text-3xl font-bold shadow-md border-2 border-[#D2C8BA]/40">
              {user?.fullName?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl font-normal text-[#FAF8F3]">{user?.fullName}</h1>
                <span className="px-3 py-1 bg-[#FAF8F3] text-[#271E18] text-[10px] font-sans font-bold uppercase tracking-[0.2em] rounded-[1px] shadow-sm">
                  {currentTier?.name || 'Classic'} Patron
                </span>
              </div>
              <p className="font-sans text-xs text-[#D2C8BA]">{user?.email}</p>
              <p className="font-sans text-[11px] text-[#A58548] uppercase tracking-wider">
                Mã định danh: AUR-PATRON-{String(user?.id || 1).padStart(4, '0')}
              </p>
            </div>
          </div>

          <div className="z-10 flex flex-col items-start md:items-end gap-2 border-t md:border-t-0 md:border-l border-[#D2C8BA]/20 pt-4 md:pt-0 md:pl-8 text-xs font-sans">
            <span className="text-[10px] uppercase tracking-widest text-[#D2C8BA]">Đặc quyền chiết khấu</span>
            <span className="font-serif text-3xl font-bold text-[#A58548]">
              {currentTier ? `${currentTier.discountPct}%` : '0%'}
            </span>
            <span className="text-[10px] text-[#D2C8BA]/80">Áp dụng trực tiếp trên mọi tác phẩm</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. TIẾN ĐỘ THĂNG HẠNG (TIER PROGRESSION GAUGE)               */}
        {/* ============================================================ */}
        <div className="p-8 bg-[#F6F3ED] border border-[#D2C8BA]/60 rounded-[2px] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#7B6E64] block">
                Tổng chi tiêu ủy thác tích lũy
              </span>
              <span className="font-serif text-3xl font-medium text-[#0D0703]">
                {formatVND(currentSpent)}
              </span>
            </div>

            {nextTier ? (
              <div className="text-left sm:text-right text-xs font-sans">
                <span className="text-[#7B6E64] block">Mục tiêu nâng hạng kế tiếp:</span>
                <span className="font-semibold text-[#0D0703]">
                  {nextTier.name} ({formatVND(nextTier.minSpent)})
                </span>
              </div>
            ) : (
              <div className="text-xs font-sans text-emerald-800 font-semibold uppercase tracking-wider">
                ✦ Hạng Đặc Quyền Cao Nhất
              </div>
            )}
          </div>

          {/* Thanh progress bar */}
          <div className="w-full bg-[#EAE4D9] h-3 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-[#A58548] to-[#271E18] h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Chú thích tiến độ */}
          <div className="flex items-center justify-between text-xs font-sans text-[#7B6E64]">
            <span>{currentTier?.name || 'Classic'}</span>
            {nextTier ? (
              <span className="text-[#0D0703] font-medium">
                Cần ủy thác thêm <strong className="text-[#A58548]">{formatVND(remainingToNextTier)}</strong> để đạt hạng <strong>{nextTier.name}</strong> (Ưu đãi {nextTier.discountPct}%)
              </span>
            ) : (
              <span className="text-emerald-800 font-medium">
                Quý khách đang thụ hưởng các đặc quyền cao cấp nhất của Hoàng gia AUREN.
              </span>
            )}
            <span>{nextTier ? nextTier.name : 'Tối đa'}</span>
          </div>
        </div>

        {/* Thông báo cập nhật */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-[2px] text-xs text-emerald-900 flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold ml-4">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-[2px] text-xs text-red-900 flex items-center justify-between">
            <span>⚠ {errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-red-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. BỐ CỤC 2 CỘT: FORM THÔNG TIN & BẢNG ĐẶC QUYỀN HẠNG        */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* CỘT TRÁI (7 CỘT): FORM CẬP NHẬT THÔNG TIN WHITE-GLOVE */}
          <div className="lg:col-span-7 bg-[#FAF8F3] border border-[#D2C8BA] p-8 rounded-[2px] shadow-sm space-y-6">
            <div className="border-b border-[#D2C8BA]/40 pb-4">
              <h2 className="font-serif text-2xl text-[#0D0703] font-normal">
                Hồ sơ giao nhận White-Glove
              </h2>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">
                Thông tin này được sử dụng tự động khi quý khách đặt mua tác phẩm hoặc bản Limited Edition.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                  Danh tự Quý Patron (Họ và tên) <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#D2C8BA] px-3.5 py-2.5 text-xs text-[#0D0703] rounded-[1px] focus:outline-none focus:border-[#A58548]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                  Số điện thoại liên lạc riêng
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="w-full bg-[#FAF8F3] border border-[#D2C8BA] px-3.5 py-2.5 text-xs text-[#0D0703] rounded-[1px] focus:outline-none focus:border-[#A58548]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                  Địa chỉ dinh thự / Căn hộ bàn giao
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Dinh thự Holm Villas, 145 Nguyễn Văn Hưởng, Thảo Điền"
                  className="w-full bg-[#FAF8F3] border border-[#D2C8BA] px-3.5 py-2.5 text-xs text-[#0D0703] rounded-[1px] focus:outline-none focus:border-[#A58548]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                  Tỉnh / Thành phố
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ví dụ: TP. Hồ Chí Minh"
                  className="w-full bg-[#FAF8F3] border border-[#D2C8BA] px-3.5 py-2.5 text-xs text-[#0D0703] rounded-[1px] focus:outline-none focus:border-[#A58548]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#271E18] text-[#FAF8F3] px-8 py-3.5 text-xs font-sans font-bold uppercase tracking-[0.2em] rounded-[2px] hover:bg-[#0D0703] transition-all shadow-md active:translate-y-0.5 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi hồ sơ'}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-[#BA1A1A] hover:text-red-900 underline font-sans uppercase tracking-wider"
                >
                  Đăng xuất an toàn
                </button>
              </div>
            </form>
          </div>

          {/* CỘT PHẢI (5 CỘT): BẢNG QUYỀN LỢI ĐẶC QUYỀN THEO HẠNG */}
          <div className="lg:col-span-5 bg-[#F6F3ED] border border-[#D2C8BA]/60 p-8 rounded-[2px] shadow-sm space-y-6">
            <h3 className="font-serif text-xl text-[#0D0703] border-b border-[#D2C8BA]/40 pb-3">
              Đặc quyền thứ hạng AUREN
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-3.5 bg-[#FAF8F3] border border-[#D2C8BA]/50 rounded-[2px] space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#0D0703] uppercase tracking-wider font-semibold">Classic Patron</strong>
                  <span className="font-mono text-[#7B6E64]">0%</span>
                </div>
                <p className="text-[#7B6E64] text-[11px]">
                  Quyền đặt mua toàn bộ tác phẩm trên sàn, bảo hành kết cấu 5 năm.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F3] border border-[#D2C8BA]/50 rounded-[2px] space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#0D0703] uppercase tracking-wider font-semibold">Silver Patron</strong>
                  <span className="font-mono text-[#A58548] font-bold">5%</span>
                </div>
                <p className="text-[#7B6E64] text-[11px]">
                  Giảm 5% trực tiếp, miễn phí gói thẩm định chất liệu da & gỗ tại gia.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F3] border border-[#A58548]/40 rounded-[2px] space-y-1 ring-1 ring-[#A58548]/20">
                <div className="flex items-center justify-between">
                  <strong className="text-[#A58548] uppercase tracking-wider font-bold">Gold Patron</strong>
                  <span className="font-mono text-[#A58548] font-bold">10%</span>
                </div>
                <p className="text-[#7B6E64] text-[11px]">
                  Giảm 10%, miễn phí dịch vụ White-Glove toàn quốc, trải nghiệm riêng tư tại Atelier.
                </p>
              </div>

              <div className="p-3.5 bg-[#271E18] text-[#FAF8F3] rounded-[2px] space-y-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <strong className="text-[#FAF8F3] uppercase tracking-wider font-bold">Platinum Patron</strong>
                  <span className="font-mono text-[#A58548] font-bold">15%</span>
                </div>
                <p className="text-[#D2C8BA] text-[11px]">
                  Giảm 15%, quyền ưu tiên đặt trước bản Limited Edition số 01-10, Giám tuyển riêng 24/7.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/account/orders"
                className="w-full inline-block py-3 text-center bg-[#FAF8F3] text-[#0D0703] border border-[#D2C8BA] text-xs uppercase tracking-widest font-semibold rounded-[2px] hover:bg-[#FAF8F3]/60 transition-colors"
              >
                Xem lịch sử đơn hàng của tôi →
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
