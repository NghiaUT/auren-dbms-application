import React from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface CustomerProfileHeaderProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const CustomerProfileHeader: React.FC<CustomerProfileHeaderProps> = ({
  user,
  onLogout,
}) => {
  return (
    <>
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-sans text-[#7B6E64] mb-6">
        <Link to="/" className="hover:text-[#0D0703]">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-[#0D0703] font-medium">Hồ sơ khách hàng Patron</span>
        <span>/</span>
        <span className="text-[#A7824B]">Lịch sử đơn hàng</span>
      </div>

      {/* Customer Profile Banner */}
      <div className="p-8 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#271E18] text-[#FAF8F3] flex items-center justify-center font-serif text-2xl font-bold">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl text-[#0D0703]">{user?.fullName}</h1>
              <span className="px-3 py-1 bg-[#503625] text-[#FAF8F3] text-[10px] font-sans font-bold uppercase tracking-widest rounded-[1px]">
                {user?.customer?.tier?.name || 'Classic'} Patron
              </span>
            </div>
            <p className="font-sans text-xs text-[#7B6E64] mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-xs font-sans border-t md:border-t-0 md:border-l border-[#D2C8BA]/60 pt-4 md:pt-0 md:pl-8">
          <div>
            <span className="text-[#7B6E64] block text-[10px] uppercase tracking-wider mb-0.5">
              Tổng chi tiêu tích lũy
            </span>
            <span className="font-bold text-lg text-[#0D0703] tabular-nums">
              {formatVND(user?.customer?.totalSpent || 0)}
            </span>
          </div>
          {user?.customer?.tier && (
            <div>
              <span className="text-[#7B6E64] block text-[10px] uppercase tracking-wider mb-0.5">
                Đặc quyền giảm giá
              </span>
              <span className="font-bold text-lg text-[#A7824B]">
                -{user.customer.tier.discountPct}%
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="text-xs uppercase tracking-wider font-semibold text-[#BA1A1A] hover:underline"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};
