// ============================================================================
// File: frontend/src/components/SalesHeaderNav.tsx
// Vai trò: Thanh điều hướng dùng chung cho toàn bộ phân hệ Sales (S01 - S07):
//          - Hiển thị thông tin phiên Sales và nút Đăng xuất
//          - Thanh Tab chuyển nhanh giữa Tổng quan, Hàng đợi đơn, Kho, Nhập hàng, Công nợ
// ============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, Boxes, AlertTriangle, CreditCard, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export const SalesHeaderNav: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Tổng quan', path: '/sales', icon: LayoutDashboard },
    { label: 'Hàng đợi đơn hàng', path: '/sales/orders', icon: Inbox },
    { label: 'Kho Showroom', path: '/sales/inventory', icon: Boxes },
    { label: 'Cảnh báo & Nhập kho', path: '/sales/inventory/low-stock', icon: AlertTriangle },
    { label: 'Sổ nợ & Quá hạn', path: '/sales/receivables', icon: CreditCard },
  ];

  const isActive = (path: string) => {
    if (path === '/sales') {
      return location.pathname === '/sales';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-full bg-[#FAF8F3] border-b border-[#D2C8BA] mb-8 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-6">
        {/* Header Thông tin Sales & Thao tác */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D2C8BA]/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-[#271E18] text-[#FAF8F3] font-bold rounded-[1px]">
                Sales Atelier
              </span>
              <span className="font-sans text-xs text-[#7B6E64]">Cổng tác nghiệp Bán hàng & Điều phối White-Glove</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl text-[#0D0703] mt-1.5 font-medium">
              AUREN Sales Portal
            </h1>
            <p className="font-sans text-xs text-[#7B6E64]">
              Đang đăng nhập: <strong className="text-[#0D0703]">{user?.fullName}</strong> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold text-[#372A22] border border-[#D2C8BA] hover:bg-white rounded-[2px] transition-colors"
            >
              <span>Xem Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </Link>

            <button
              onClick={() => logout()}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold text-[#BA1A1A] hover:bg-[#BA1A1A]/10 border border-transparent rounded-[2px] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Tab Điều hướng Phân hệ Sales */}
        <nav className="flex items-center gap-1 md:gap-4 overflow-x-auto no-scrollbar pt-2" aria-label="Sales Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs uppercase tracking-[0.12em] font-semibold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-[#271E18] text-[#0D0703]'
                    : 'border-transparent text-[#7B6E64] hover:text-[#0D0703] hover:border-[#D2C8BA]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#A7824B]' : 'text-[#7B6E64]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
