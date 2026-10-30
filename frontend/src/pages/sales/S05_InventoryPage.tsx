// ============================================================================
// File: frontend/src/pages/sales/S05_InventoryPage.tsx
// Mã màn hình: S05 | Route: /sales/inventory | FR: FR12
// Vai trò: Tra cứu tồn kho Showroom — Liệt kê chi tiết số lượng tồn thực tế,
//          đang giữ và khả dụng theo từng showroom/kho và tổng toàn hệ thống.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Boxes, AlertTriangle, RefreshCw, Filter, ArrowUpRight } from 'lucide-react';
import { SalesHeaderNav } from '../../components/SalesHeaderNav';
import { getSalesInventoryApi } from '../../api/sales.api';
import type { InventoryItem, PageMeta } from '../../types';

export const S05_InventoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLocationId = searchParams.get('locationId') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchSku, setSearchSku] = useState<string>('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getSalesInventoryApi({
        locationId: currentLocationId ? Number(currentLocationId) : undefined,
        sku: searchSku || undefined,
        page: currentPage,
        limit: 10,
      });
      setInventory(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      console.error('Lỗi khi nạp danh sách tồn kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentLocationId, currentPage]);

  const handleLocationChange = (locId: string) => {
    const params: Record<string, string> = { page: '1' };
    if (locId) params.locationId = locId;
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Tiêu đề & Cảnh báo nhanh */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              Atelier Vault & Showrooms
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] mt-1">Sổ Tồn Kho Kiến Trúc</h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/sales/inventory/low-stock"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF8F3] border border-[#BA1A1A]/30 text-[#BA1A1A] hover:bg-[#BA1A1A]/10 rounded-[2px] text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Xem Cảnh Báo Sắp Hết Hàng →</span>
            </Link>

            <button
              onClick={fetchInventory}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] text-xs font-semibold uppercase tracking-wider text-[#372A22] hover:bg-[#FAF8F3] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* THANH BỘ LỌC SHOWROOM & TÌM KIẾM                            */}
        {/* ============================================================ */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] mb-6 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-[#7B6E64]" />
              <select
                value={currentLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="text-xs bg-white border border-[#D2C8BA] rounded-[2px] px-3 py-2 text-[#0D0703] focus:outline-none focus:border-[#271E18]"
              >
                <option value="">Tất cả kho & Showroom</option>
                <option value="1">Showroom Quận 1, TP.HCM</option>
                <option value="2">Showroom Hoàn Kiếm, Hà Nội</option>
                <option value="3">Showroom Hải Châu, Đà Nẵng</option>
                <option value="4">Kho Tổng TP.HCM (Thủ Đức)</option>
                <option value="5">Kho Bắc Ninh (Hà Nội)</option>
                <option value="6">Atelier Chế Tác Thủ Đức</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchSku}
                  onChange={(e) => setSearchSku(e.target.value)}
                  placeholder="Tìm theo SKU hoặc tên..."
                  className="text-xs bg-white border border-[#D2C8BA] rounded-[2px] pl-8 pr-3 py-2 text-[#0D0703] w-56 sm:w-72 focus:outline-none focus:border-[#271E18]"
                />
                <Search className="w-3.5 h-3.5 text-[#7B6E64] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-white border border-[#D2C8BA] hover:bg-[#FAF8F3] text-xs uppercase tracking-wider font-semibold rounded-[2px]"
              >
                Tìm
              </button>
            </form>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BẢNG TỒN KHO CHI TIẾT                                        */}
        {/* ============================================================ */}
        <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#7B6E64]">
              Đang tải danh mục tồn kho...
            </div>
          ) : inventory.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-[#0D0703]">Không tìm thấy dữ liệu tồn kho</p>
              <p className="font-sans text-xs text-[#7B6E64] mt-1">Không có bản ghi nào khớp với điều kiện tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D2C8BA] bg-[#F4EFE6]/60 text-[10px] font-mono uppercase tracking-widest text-[#7B6E64]">
                    <th className="py-3.5 px-5">Mã SKU</th>
                    <th className="py-3.5 px-4">Tác Phẩm</th>
                    <th className="py-3.5 px-4">Showroom / Kho</th>
                    <th className="py-3.5 px-4 text-right">Tồn Thực</th>
                    <th className="py-3.5 px-4 text-right">Đang Giữ</th>
                    <th className="py-3.5 px-4 text-right">Khả Dụng Tại Chỗ</th>
                    <th className="py-3.5 px-4 text-right">Tổng Toàn Mạng Lưới</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2C8BA]/30 font-sans text-xs">
                  {inventory.map((row) => (
                    <tr key={`${row.variantId}-${row.locationId}`} className="hover:bg-white/70 transition-colors">
                      <td className="py-4 px-5 font-mono font-semibold text-[#0D0703]">
                        {row.sku}
                      </td>
                      <td className="py-4 px-4 font-medium text-[#0D0703]">
                        {row.productName}
                      </td>
                      <td className="py-4 px-4 text-[#7B6E64]">
                        {row.locationName}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-[#0D0703]">
                        {row.qtyOnHand}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-[#A7824B]">
                        {row.qtyReserved}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`font-mono font-semibold px-2 py-0.5 rounded-[1px] ${
                            row.available <= 0
                              ? 'bg-[#FFEBEE] text-[#C62828]'
                              : row.available < 3
                              ? 'bg-[#FFF8E1] text-[#8D6E63]'
                              : 'bg-[#E8F5E9] text-[#2E7D32]'
                          }`}
                        >
                          {row.available}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-medium text-[#0D0703]">
                        {row.totalAvailable}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          to={`/sales/inventory/low-stock?variantId=${row.variantId}&locationId=${row.locationId}&version=${row.version}&sku=${row.sku}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#503625] hover:underline"
                        >
                          <span>Nhập thêm</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[#D2C8BA]/40 bg-[#F4EFE6]/30 text-xs">
              <span className="text-[#7B6E64]">
                Hiển thị trang {meta.page} trên {meta.totalPages} ({meta.total} biến thể)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setSearchParams({ locationId: currentLocationId, page: String(meta.page - 1) })}
                  className="px-3 py-1 bg-white border border-[#D2C8BA] rounded-[2px] disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setSearchParams({ locationId: currentLocationId, page: String(meta.page + 1) })}
                  className="px-3 py-1 bg-white border border-[#D2C8BA] rounded-[2px] disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
export default S05_InventoryPage;
