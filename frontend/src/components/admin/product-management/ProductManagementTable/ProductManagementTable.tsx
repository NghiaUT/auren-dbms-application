import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta, ProductSummary } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';

export interface ProductManagementTableProps {
  products: ProductSummary[];
  loading: boolean;
  pageMeta?: PageMeta;
  onPageChange?: (newPage: number) => void;
  onEdit: (product: ProductSummary) => void;
  onDelete: (productId: number, productName: string) => void;
}

export const ProductManagementTable: React.FC<ProductManagementTableProps> = ({
  products,
  loading,
  pageMeta,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">ID</th>
              <th className="py-3 px-4">Tác phẩm &amp; Bộ sưu tập</th>
              <th className="py-3 px-4">Thương hiệu</th>
              <th className="py-3 px-4">Danh mục</th>
              <th className="py-3 px-4 text-center">Đặc tính</th>
              <th className="py-3 px-4 text-right">Giá khởi điểm</th>
              <th className="py-3 px-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#7B6E64]">
                  {loading ? 'Đang tải danh sách...' : 'Không tìm thấy sản phẩm nào phù hợp.'}
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                  <td className="py-3 px-4 text-center font-mono font-medium text-[#7B6E64]">
                    #{p.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-serif text-sm font-medium text-[#0D0703]">{p.name}</div>
                    {(p.collectionName || p.designerName) && (
                      <div className="font-sans text-[11px] text-[#7B6E64] mt-0.5">
                        {p.collectionName} {p.designerName ? `— NTK ${p.designerName}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0D0703]">{p.brand.name}</td>
                  <td className="py-3 px-4 text-[#503625]">{p.category.name}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {p.isLimited && (
                        <span className="px-1.5 py-0.5 bg-[#A7824B] text-white font-mono text-[9px] uppercase tracking-wider rounded-[1px] font-bold">
                          Limited
                        </span>
                      )}
                      {p.isMadeToOrder && (
                        <span className="px-1.5 py-0.5 bg-[#271E18] text-[#FAF8F3] font-mono text-[9px] uppercase tracking-wider rounded-[1px]">
                          Bespoke
                        </span>
                      )}
                      {!p.isLimited && !p.isMadeToOrder && (
                        <span className="text-[#7B6E64] text-[10px] font-mono">Standard</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-[#0D0703] tabular-nums">
                    {p.minPrice > 0 ? formatVND(p.minPrice) : 'Chưa có giá'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        to={`/admin/products/${p.id}/variants`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#503625] bg-white border border-[#D2C8BA] rounded-[2px] hover:bg-[#FAF8F3]"
                        title="Quản lý biến thể & chất liệu"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#A7824B]" />
                        <span>Biến thể</span>
                      </Link>

                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 text-[#503625] hover:text-[#0D0703] hover:bg-[#EAE4D9]/40 rounded-[2px]"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDelete(p.id, p.name)}
                        className="p-1.5 text-[#BA1A1A] hover:bg-red-50 rounded-[2px]"
                        title="Xóa an toàn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh Phân trang Quản trị (Admin Pagination Footer) */}
      {pageMeta && pageMeta.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#D2C8BA]/60 bg-[#F4EFE6]/30 text-xs">
          <span className="font-sans text-[#7B6E64]">
            Hiển thị trang <strong className="text-[#0D0703]">{pageMeta.page}</strong> / <strong className="text-[#0D0703]">{pageMeta.totalPages}</strong> (Tổng số <strong className="text-[#0D0703]">{pageMeta.total}</strong> tác phẩm)
          </span>

          {pageMeta.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pageMeta.page <= 1 || loading}
                onClick={() => onPageChange?.(pageMeta.page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#D2C8BA] rounded-[2px] font-sans text-xs text-[#0D0703] hover:bg-[#FAF8F3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {/* Dãy số trang trực tiếp */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: pageMeta.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (p === 1 || p === pageMeta.totalPages) return true;
                    return Math.abs(p - pageMeta.page) <= 1;
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const isGap = prev && p - prev > 1;
                    const isActive = p === pageMeta.page;

                    return (
                      <React.Fragment key={p}>
                        {isGap && <span className="px-1 text-[#7B6E64]">...</span>}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => onPageChange?.(p)}
                          className={`min-w-[28px] h-7 px-2 font-mono text-xs rounded-[2px] transition-colors ${
                            isActive
                              ? 'bg-[#271E18] text-[#FAF8F3] font-bold shadow-sm'
                              : 'bg-white border border-[#D2C8BA] text-[#0D0703] hover:bg-[#FAF8F3]'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={pageMeta.page >= pageMeta.totalPages || loading}
                onClick={() => onPageChange?.(pageMeta.page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#D2C8BA] rounded-[2px] font-sans text-xs text-[#0D0703] hover:bg-[#FAF8F3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang sau"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
