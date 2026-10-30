import React from 'react';
import { Link } from 'react-router-dom';
import { Package, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';

export const AdminQuickActions: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Link
        to="/admin/products"
        className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#0D0703] transition-colors group flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-[#503625]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
              [FR14] Catalog
            </span>
          </div>
          <h4 className="font-serif text-lg text-[#0D0703] font-medium group-hover:underline">
            Quản lý Sản phẩm &amp; Biến thể
          </h4>
          <p className="font-sans text-xs text-[#7B6E64] mt-1">
            Thêm sản phẩm mới, thiết lập biến thể, gắn chất liệu và xóa an toàn bằng NOT EXISTS.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#7B6E64] group-hover:translate-x-1 transition-transform mt-1" />
      </Link>

      <Link
        to="/admin/reports/brands"
        className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#0D0703] transition-colors group flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#503625]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
              [FR15a] Having Query
            </span>
          </div>
          <h4 className="font-serif text-lg text-[#0D0703] font-medium group-hover:underline">
            Doanh số theo Thương hiệu
          </h4>
          <p className="font-sans text-xs text-[#7B6E64] mt-1">
            Lọc doanh số các thương hiệu hàng đầu với ngưỡng tối thiểu (HAVING clause).
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#7B6E64] group-hover:translate-x-1 transition-transform mt-1" />
      </Link>

      <Link
        to="/admin/tiers"
        className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] hover:border-[#0D0703] transition-colors group flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-[#503625]" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
              [FR15b] Subquery &amp; ACID
            </span>
          </div>
          <h4 className="font-serif text-lg text-[#0D0703] font-medium group-hover:underline">
            Hạng &amp; Nâng hạng tự động
          </h4>
          <p className="font-sans text-xs text-[#7B6E64] mt-1">
            Cập nhật cấu hình hạng và chạy nâng hạng tự động cho khách hàng trong Transaction.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#7B6E64] group-hover:translate-x-1 transition-transform mt-1" />
      </Link>
    </div>
  );
};
