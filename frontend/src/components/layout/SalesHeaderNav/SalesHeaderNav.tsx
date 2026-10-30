// ============================================================================
// File: frontend/src/components/layout/SalesHeaderNav/SalesHeaderNav.tsx
// Vai trò: Thanh điều hướng dùng chung cho toàn bộ phân hệ Sales (S01 - S07):
//          - Hiển thị thông tin phiên Sales và nút Đăng xuất
//          - Thanh Tab chuyển nhanh giữa Tổng quan, Hàng đợi đơn, Kho, Nhập hàng, Công nợ
// ============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, Boxes, AlertTriangle, CreditCard, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth';

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
              <span className="font-sans text-xs text-[#7B6E64]">Cổng tác nghiệp Bán hàng &amp; Điều phối White-Glove</span>
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
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] text-xs font-semibold text-[#0D0703] hover:bg-[#FAF8F3] transition-colors"
            >
              <span>Xem Cửa hàng AUREN</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#7B6E64]" />
            </Link>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] text-xs font-semibold text-[#A93226] hover:bg-[#FFEBEE] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Thanh Điều Hướng (Tabs) */}
        <nav aria-label="Thanh chuyển tab chức năng Sales" className="flex items-center gap-1 md:gap-4 overflow-x-auto pt-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-3 font-sans text-xs uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                  active
                    ? 'border-[#271E18] text-[#0D0703] font-semibold bg-white/60'
                    : 'border-transparent text-[#7B6E64] hover:text-[#0D0703] hover:border-[#D2C8BA]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#A58548]' : 'text-[#7B6E64]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
