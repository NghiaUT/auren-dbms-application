// ============================================================================
// File: frontend/src/components/layout/PublicHeader/PublicHeader.tsx
// Vai trò: Thanh điều hướng phía trên (Header) dùng chung cho các trang công khai:
//          - Logo AUREN dẫn về trang chủ (/)
//          - Menu điều hướng máy tính & ngăn kéo menu di động (Mobile Drawer)
//          - Khu vực trạng thái xác thực: Đăng nhập/Đăng ký khi là Guest,
//            Hiển thị Avatar, Vai trò và Nút Đăng xuất khi đã có phiên
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth';
import { getCartCount } from '../../../utils/cartStorage';
import { NAV_ITEMS } from '../../../data/mockData';

export interface PublicHeaderProps {
  readonly bagCount?: number;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ bagCount }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [currentBagCount, setCurrentBagCount] = useState<number>(bagCount ?? getCartCount());

  // Đồng bộ số lượng túi hàng
  useEffect(() => {
    if (bagCount !== undefined) {
      setCurrentBagCount(bagCount);
      return;
    }
    const updateCount = () => setCurrentBagCount(getCartCount());
    updateCount();
    window.addEventListener('cart_updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('cart_updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, [bagCount]);

  // Hiệu ứng mờ nền khi cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'sales') return '/sales';
    return '/account/orders';
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled
          ? 'bg-[#FCF9F3]/95 backdrop-blur-md border-b border-[#D2C8BA]/50 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
          : 'bg-[#FCF9F3]/80 backdrop-blur-sm border-b border-[#D2C8BA]/25 py-5'
          }`}
      >
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Logo AUREN (Luôn link về trang chủ / theo quy tắc Phase 3) */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="font-serif text-2xl lg:text-3xl tracking-[0.2em] uppercase text-[#0D0703] font-medium select-none hover:opacity-85 transition-opacity"
            >
              AUREN
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) =>
              item.anchor ? (
                <a
                  key={item.label}
                  href={item.path}
                  className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-[#372A22]/80 hover:text-[#0D0703] transition-colors py-1 link-line"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  className="font-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-[#372A22]/80 hover:text-[#0D0703] transition-colors py-1 link-line"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Actions & Auth */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Bag Icon */}
            {(!user || !['admin', 'sales'].includes(user.role)) && (<Link
              to="/cart"
              className="relative text-[#372A22] hover:text-[#0D0703] transition-colors p-1"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {currentBagCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#503625] text-[#FAF8F3] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {currentBagCount}
                </span>
              )}
            </Link>)}

            {/* Auth Buttons / Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 text-left py-1 px-2.5 rounded-[2px] border border-[#D2C8BA]/60 hover:border-[#271E18] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#271E18] text-[#FAF8F3] flex items-center justify-center text-[11px] font-bold">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#271E18] max-w-[100px] truncate">
                    {user.fullName.split(' ').pop()}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#EAE4D9] text-[#503625] font-mono uppercase rounded-[1px]">
                    {user.role}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#FAF8F3] border border-[#D2C8BA] shadow-lg rounded-[2px] py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#D2C8BA]/40">
                      <p className="font-sans text-[11px] font-bold text-[#0D0703] truncate">
                        {user.fullName}
                      </p>
                      <p className="font-sans text-[10px] text-[#7B6E64] truncate">{user.email}</p>
                      {user.customer?.tier && (
                        <p className="mt-1 font-sans text-[9px] uppercase tracking-wider text-[#A7824B] font-semibold">
                          Hạng: {user.customer.tier.name} (-{user.customer.tier.discountPct}%)
                        </p>
                      )}
                    </div>

                    <Link
                      to={getDashboardRoute()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-[#372A22] hover:bg-[#F0EEE8] transition-colors"
                    >
                      Bảng điều khiển
                    </Link>

                    {user.role === 'customer' && (
                      <>
                        <Link
                          to="/account/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-[#372A22] hover:bg-[#F0EEE8] transition-colors"
                        >
                          Hồ sơ Patron &amp; Hạng thẻ
                        </Link>
                        <Link
                          to="/account/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-[#372A22] hover:bg-[#F0EEE8] transition-colors"
                        >
                          Đơn hàng của tôi
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.14em] text-[#BA1A1A] hover:bg-[#BA1A1A]/10 transition-colors border-t border-[#D2C8BA]/40 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#372A22] hover:text-[#0D0703] px-2.5 py-1.5 transition-colors link-line"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex btn-auren-solid text-[10px] py-2 px-4 tracking-[0.16em]"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[#372A22] hover:text-[#0D0703] focus:outline-none"
              aria-label="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation (Styled in Walnut Wood tone as specified in Stitch design) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#503625] text-[#FAF8F3] pt-24 px-6 pb-8 flex flex-col justify-between md:hidden transition-all duration-300">
          <div className="flex flex-col gap-6">
            <span className="eyebrow eyebrow-light">Điều hướng kiến trúc</span>
            <div className="flex flex-col gap-4">
              {NAV_ITEMS.map((item, idx) =>
                item.anchor ? (
                  <a
                    key={item.label}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-serif text-2xl tracking-wide hover:translate-x-2 transition-transform"
                  >
                    0{idx + 1} / {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-serif text-2xl tracking-wide hover:translate-x-2 transition-transform"
                  >
                    0{idx + 1} / {item.label}
                  </Link>
                )
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              {isAuthenticated && user ? (
                <>
                  <p className="font-sans text-xs text-white/70">
                    Đăng nhập: <strong className="text-white">{user.fullName}</strong> ({user.role})
                  </p>
                  <Link
                    to={getDashboardRoute()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-auren-light text-center py-2.5 text-xs"
                  >
                    Truy cập bảng điều khiển
                  </Link>
                  {user.role === 'customer' && (
                    <Link
                      to="/account/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="border border-white/20 text-center py-2 text-xs uppercase tracking-wider text-white hover:bg-white/10 rounded-[2px]"
                    >
                      Hồ sơ Patron &amp; Hạng thẻ
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left font-sans text-xs uppercase tracking-wider text-red-300 py-1"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-auren-light text-center py-2.5 text-xs"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="border border-white/40 text-center py-2.5 text-xs uppercase tracking-[0.16em] hover:bg-white/10 rounded-[2px]"
                  >
                    Đăng ký tài khoản
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
            <span>AUREN Studio Stockholm</span>
            <span>Est. 2019</span>
          </div>
        </div>
      )}
    </>
  );
};
