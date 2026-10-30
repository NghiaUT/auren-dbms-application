// ============================================================================
// File: frontend/src/pages/admin/A03_BrandSalesReportPage.tsx
// Mã màn hình: A03 | Route: /admin/reports/brands | FR: FR15a
// Vai trò: Báo cáo Doanh số theo Thương hiệu — Minh họa truy vấn chuẩn môn học CSDL:
//          JOIN 5 bảng kết hợp GROUP BY và mệnh đề HAVING lọc ngưỡng doanh thu tối thiểu.
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Award, Filter, RefreshCw, Layers } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getBrandSalesReportApi } from '../../api/admin.api';
import type { BrandSalesReportItem } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const A03_BrandSalesReportPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<BrandSalesReportItem[]>([]);
  const [minRevenue, setMinRevenue] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);

  const fetchBrandSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getBrandSalesReportApi({
        min: minRevenue,
        limit,
      });
      setData(items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải báo cáo doanh số thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandSales();
  }, [minRevenue, limit]);

  const totalFilteredRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalUnitsSold = data.reduce((sum, item) => sum + item.unitsSold, 0);

  const presets = [
    { label: 'Tất cả (>= 0)', value: 0 },
    { label: '>= 20 Triệu', value: 20000000 },
    { label: '>= 50 Triệu', value: 50000000 },
    { label: '>= 100 Triệu', value: 100000000 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tiêu đề & Thông tin học thuật */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
                [FR15a] Advanced Aggregation
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#271E18] text-[#FAF8F3] font-bold rounded-[1px]">
                HAVING CLAUSE DEMO
              </span>
            </div>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Doanh số theo Thương hiệu
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Truy vấn liên kết 5 bảng (`brands` $\to$ `products` $\to$ `product_variants` $\to$ `order_items` $\to$ `orders`).
            </p>
          </div>

          <button
            onClick={fetchBrandSales}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold bg-[#0D0703] text-white rounded-[2px] transition-colors self-start lg:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Cập nhật số liệu</span>
          </button>
        </div>

        {/* Khối giải thích học thuật DBMS */}
        <div className="p-4 bg-[#FAF8F3] border-l-4 border-[#A7824B] border border-[#D2C8BA] rounded-[2px] text-xs space-y-1">
          <p className="font-semibold text-[#0D0703]">
            💡 Điểm trọng tâm môn học Cơ sở dữ liệu:
          </p>
          <p className="text-[#503625]">
            Mệnh đề <code className="font-mono bg-[#EAE4D9] px-1 py-0.5 rounded-[2px]">HAVING revenue &gt;= ?</code> được thực thi <strong>sau</strong> khi hệ thống gom nhóm dữ liệu bằng <code className="font-mono bg-[#EAE4D9] px-1 py-0.5 rounded-[2px]">GROUP BY b.id, b.name</code> để sàng lọc chỉ những thương hiệu đạt chỉ tiêu doanh số.
          </p>
        </div>

        {/* Bộ lọc tương tác thời gian thực cho mệnh đề HAVING */}
        <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-sans text-xs font-semibold text-[#0D0703] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#A7824B]" />
              Ngưỡng tối thiểu (HAVING):
            </span>
            <div className="flex items-center gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setMinRevenue(p.value)}
                  className={`px-2.5 py-1 text-xs rounded-[2px] transition-colors font-mono ${
                    minRevenue === p.value
                      ? 'bg-[#0D0703] text-white font-semibold'
                      : 'bg-white border border-[#D2C8BA] text-[#503625] hover:bg-[#EAE4D9]/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#7B6E64]">Top hiển thị:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-[2px]">
            {error}
          </div>
        )}

        {/* Biểu đồ Doanh số Recharts */}
        <div className="p-6 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px]">
          <div className="mb-4">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#A7824B] font-bold">
              [Visual Analytics]
            </span>
            <h3 className="font-serif text-xl text-[#0D0703] font-medium">
              So sánh Doanh số Thương hiệu đạt chuẩn (Delivered)
            </h3>
          </div>

          <div className="h-[320px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#7B6E64]">
                Đang xử lý truy vấn JOIN & HAVING...
              </div>
            ) : data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#7B6E64]">
                Không có thương hiệu nào đạt ngưỡng doanh số {formatVND(minRevenue)}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D2C8BA" opacity={0.5} />
                  <XAxis
                    type="number"
                    stroke="#7B6E64"
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="brandName"
                    type="category"
                    stroke="#7B6E64"
                    fontSize={11}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatVND(Number(val)), 'Doanh số']}
                    labelFormatter={(label) => `Thương hiệu: ${label}`}
                    contentStyle={{
                      backgroundColor: '#FAF8F3',
                      borderColor: '#D2C8BA',
                      fontSize: '12px',
                      borderRadius: '2px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#A7824B" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu xếp hạng */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
          <div className="p-4 border-b border-[#D2C8BA]/60 flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#0D0703] font-medium">
              Bảng Xếp hạng Thương hiệu theo Doanh thu
            </h3>
            <span className="font-mono text-xs text-[#7B6E64]">
              {data.length} thương hiệu đạt ngưỡng
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Thương hiệu</th>
                  <th className="py-3 px-4 text-right">Doanh số đạt được</th>
                  <th className="py-3 px-4 text-right">Số lượng tác phẩm bán</th>
                  <th className="py-3 px-4 text-right">Tỷ trọng trong nhóm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#7B6E64]">
                      Không có thương hiệu nào thoả điều kiện lọc HAVING.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => {
                    const ratio = totalFilteredRevenue > 0 ? (item.revenue / totalFilteredRevenue) * 100 : 0;
                    return (
                      <tr key={item.brandId} className="hover:bg-[#FAF8F3]/60 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#A7824B]">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0D0703]">
                          {item.brandName}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#0D0703] tabular-nums">
                          {formatVND(item.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#503625]">
                          {item.unitsSold} chiếc
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-mono text-[#7B6E64]">
                          {ratio.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
