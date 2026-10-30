// ============================================================================
// File: frontend/src/layouts/AdminLayout.tsx
// Vai trò: Bố cục khung giao diện quản trị tối cao dành cho Admin (A01 - A08):
//   - Thanh điều hướng thương hiệu Auren Sovereign Admin (Header & Navigation Tabs)
//   - Phân chia 3 phân khu nghiệp vụ: Báo cáo kinh doanh, Quản trị catalog, Hạng thành viên
//   - Hỗ trợ cả cơ chế children component lẫn React Router Outlet
// ============================================================================

import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Award,
  Package,
  FolderTree,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navSections = [
    {
      group: 'Báo cáo & Thống kê (FR15a)',
      name: 'Báo Cáo',
      items: [
        { label: 'Dashboard KPI', path: '/admin', exact: true, icon: LayoutDashboard },
        { label: 'Doanh thu theo tháng', path: '/admin/reports/revenue', exact: false, icon: TrendingUp },
        { label: 'Doanh số Thương hiệu', path: '/admin/reports/brands', exact: false, icon: BarChart3 },
        { label: 'Đánh giá & Khách VIP', path: '/admin/reports/insights', exact: false, icon: Award },
      ],
    },
    {
      group: 'Quản trị Catalog (FR14)',
      name: 'Quản trị',
      items: [
        { label: 'Sản phẩm', path: '/admin/products', exact: false, icon: Package },
        { label: 'Dữ liệu tham chiếu', path: '/admin/catalog', exact: false, icon: FolderTree },
      ],
    },
    {
      group: 'Hạng thành viên (FR15b)',
      name: 'Hạng thành viên',
      items: [
        { label: 'Cấu hình Hạng & Nâng hạng', path: '/admin/tiers', exact: false, icon: ShieldCheck },
      ],
    },
  ];

  const isItemActive = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#FCF9F3] text-[#372A22] flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="w-full bg-[#FAF8F3] border-b border-[#D2C8BA] shadow-xs sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-[#0D0703] text-[#FAF8F3] font-bold rounded-[1px]">
                  Administrator
                </span>
                <span className="font-sans text-xs text-[#7B6E64]">Cổng Quản trị Tối cao & Khai phá Dữ liệu CSDL</span>
              </div>
              <h1 className="font-serif text-2xl text-[#0D0703] font-medium tracking-tight mt-0.5">
                AUREN Sovereign Administration
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="font-sans text-xs font-semibold text-[#0D0703]">{user?.fullName}</p>
                <p className="font-sans text-[11px] text-[#7B6E64]">{user?.email}</p>
              </div>

              <div className="flex items-center gap-2 border-l border-[#D2C8BA] pl-4">
                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-[#372A22] border border-[#D2C8BA] hover:bg-white rounded-[2px] transition-colors"
                >
                  <span>Storefront</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Link>

                {/* <Link
                  to="/sales"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-[#372A22] border border-[#D2C8BA] hover:bg-white rounded-[2px] transition-colors"
                >
                  <Layers className="w-3 h-3 text-[#A7824B]" />
                  <span>Cổng Sales</span>
                </Link> */}

                <button
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-[#BA1A1A] hover:bg-red-50 border border-transparent hover:border-red-200 rounded-[2px] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="mt-4 pt-3 border-t border-[#D2C8BA]/40 flex flex-wrap items-center gap-x-6 gap-y-2">
            {navSections.map((sec) => (
              <div key={sec.group} className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] mr-1 hidden lg:inline">
                  {sec.name}:
                </span>
                {sec.items.map((item) => {
                  const active = isItemActive(item.path, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase font-medium rounded-[2px] transition-all ${active
                        ? 'bg-[#0D0703] text-white shadow-xs font-semibold'
                        : 'text-[#503625] hover:text-[#0D0703] hover:bg-[#EAE4D9]/60'
                        }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#FAF8F3]' : 'text-[#7B6E64]'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Administrative Workspace */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-12 py-8">
        {children || <Outlet />}
      </main>

      {/* Admin Minimal Footer */}
      <footer className="w-full border-t border-[#D2C8BA] py-4 bg-[#FAF8F3] text-center font-sans text-xs text-[#7B6E64]">
        AUREN Architectural Furniture — Database Management System Project 2026. All operations are logged.
      </footer>
    </div>
  );
};
