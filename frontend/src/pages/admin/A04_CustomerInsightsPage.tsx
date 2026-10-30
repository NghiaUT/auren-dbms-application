// ============================================================================
// File: frontend/src/pages/admin/A04_CustomerInsightsPage.tsx
// Mã màn hình: A04 | Route: /admin/reports/insights | FR: FR15a
// Vai trò: Báo cáo Đánh giá Sản phẩm & Khách hàng VIP — Minh họa 2 câu truy vấn
//          nâng cao chuẩn môn học CSDL:
//          1. Mệnh đề HAVING (Điểm đánh giá theo sản phẩm có số review >= min)
//          2. Mệnh đề SUBQUERY (Khách hàng chi tiêu trên mức bình quân toàn hệ thống)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Star, Users, Award, RefreshCw, Filter, Sparkles } from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { getRatingsReportApi, getTopCustomersReportApi } from '../../api/admin.api';
import type { RatingReportItem, TopCustomerReportItem } from '../../types';
import { formatVND } from '../../utils/formatVND';

export const A04_CustomerInsightsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ratings' | 'top_customers'>('ratings');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab 1 state
  const [ratings, setRatings] = useState<RatingReportItem[]>([]);
  const [minReviews, setMinReviews] = useState<number>(3);

  // Tab 2 state
  const [topCustomers, setTopCustomers] = useState<TopCustomerReportItem[]>([]);
  const [averageSpent, setAverageSpent] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'ratings') {
        const items = await getRatingsReportApi({ min: minReviews, limit: 15 });
        setRatings(items);
      } else {
        const result = await getTopCustomersReportApi({ limit: 20 });
        setTopCustomers(result.customers);
        setAverageSpent(result.averageSpent);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải báo cáo phân tích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, minReviews]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C8BA]/60">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A7824B] font-bold">
              [FR15a] Qualitative & Segment Analytics
            </span>
            <h2 className="font-serif text-3xl text-[#0D0703] font-medium tracking-tight mt-1">
              Đánh giá Sản phẩm & Phân khúc Khách VIP
            </h2>
            <p className="font-sans text-xs text-[#7B6E64] mt-0.5">
              Khai thác dữ liệu đánh giá trải nghiệm và phân loại nhóm khách hàng trung thành giá trị cao.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold bg-[#0D0703] text-white rounded-[2px] transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#D2C8BA] gap-8">
          <button
            onClick={() => setActiveTab('ratings')}
            className={`pb-3 text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'ratings'
                ? 'border-[#0D0703] text-[#0D0703]'
                : 'border-transparent text-[#7B6E64] hover:text-[#0D0703]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-[#A7824B]" />
            <span>Đánh giá Sản phẩm (HAVING count &gt;= min)</span>
          </button>

          <button
            onClick={() => setActiveTab('top_customers')}
            className={`pb-3 text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'top_customers'
                ? 'border-[#0D0703] text-[#0D0703]'
                : 'border-transparent text-[#7B6E64] hover:text-[#0D0703]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#A7824B]" />
            <span>Khách hàng VIP (SUBQUERY &gt; AVG)</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-[2px]">
            {error}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 1: ĐÁNH GIÁ SẢN PHẨM (HAVING) */}
        {/* ==================================================================== */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F3] border-l-4 border-[#A7824B] border border-[#D2C8BA] rounded-[2px] text-xs space-y-1">
              <p className="font-semibold text-[#0D0703]">
                💡 Đặc tả Truy vấn Môn học:
              </p>
              <p className="text-[#503625]">
                Sử dụng <code className="font-mono bg-[#EAE4D9] px-1 py-0.5 rounded-[2px]">GROUP BY p.id, p.name HAVING COUNT(r.id) &gt;= ?</code> để lọc chỉ những tác phẩm có tối thiểu N lượt đánh giá thực tế từ khách hàng đã mua sản phẩm.
              </p>
            </div>

            {/* Bộ lọc ngưỡng review */}
            <div className="p-4 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] flex items-center gap-4 text-xs">
              <span className="font-semibold text-[#0D0703] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#A7824B]" />
                Số lượng đánh giá tối thiểu (HAVING):
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                {[1, 2, 3, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setMinReviews(val)}
                    className={`px-3 py-1 rounded-[2px] transition-colors ${
                      minReviews === val
                        ? 'bg-[#0D0703] text-white font-semibold'
                        : 'bg-white border border-[#D2C8BA] text-[#503625] hover:bg-[#EAE4D9]/40'
                    }`}
                  >
                    &gt;= {val} đánh giá
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng xếp hạng điểm đánh giá */}
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
              <div className="p-4 border-b border-[#D2C8BA]/60 flex items-center justify-between">
                <h3 className="font-serif text-lg text-[#0D0703] font-medium">
                  Xếp hạng Sản phẩm theo Điểm Đánh giá Trung bình
                </h3>
                <span className="font-mono text-xs text-[#7B6E64]">
                  {ratings.length} tác phẩm đạt điều kiện
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Tác phẩm Kiến trúc</th>
                      <th className="py-3 px-4 text-center">Điểm Trung bình (Rating)</th>
                      <th className="py-3 px-4 text-right">Lượt Đánh giá</th>
                      <th className="py-3 px-4 text-center">Mức độ Hài lòng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                    {ratings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#7B6E64]">
                          Không có sản phẩm nào có ít nhất {minReviews} đánh giá.
                        </td>
                      </tr>
                    ) : (
                      ratings.map((item, index) => (
                        <tr key={item.productId} className="hover:bg-[#FAF8F3]/60 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#A7824B]">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-serif font-medium text-[#0D0703] text-sm">
                            {item.productName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-[#0D0703] text-sm bg-white px-2.5 py-1 border border-[#D2C8BA] rounded-[2px]">
                              <Star className="w-3.5 h-3.5 fill-[#A7824B] text-[#A7824B]" />
                              <span>{item.avgRating.toFixed(1)} / 5.0</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-mono text-[#503625]">
                            {item.reviewCount} nhận xét
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px]">
                            {item.avgRating >= 4.5 ? (
                              <span className="text-green-800 font-semibold">Xuất sắc ★★★★★</span>
                            ) : item.avgRating >= 4.0 ? (
                              <span className="text-blue-800 font-semibold">Rất tốt ★★★★☆</span>
                            ) : (
                              <span className="text-[#7B6E64]">Bình thường ★★★☆☆</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: KHÁCH HÀNG VIP (SUBQUERY) */}
        {/* ==================================================================== */}
        {activeTab === 'top_customers' && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F3] border-l-4 border-[#503625] border border-[#D2C8BA] rounded-[2px] text-xs space-y-1">
              <p className="font-semibold text-[#0D0703]">
                💡 Đặc tả Truy vấn Môn học:
              </p>
              <p className="text-[#503625]">
                Sử dụng <code className="font-mono bg-[#EAE4D9] px-1 py-0.5 rounded-[2px]">WHERE c.total_spent &gt; (SELECT AVG(total_spent) FROM customers WHERE total_spent &gt; 0)</code> để tự động lọc danh sách khách hàng có sức mua vượt trội hơn hẳn mức trung bình của toàn bộ khách hàng trong cơ sở dữ liệu.
              </p>
            </div>

            {/* Thẻ chỉ số mức chi tiêu trung bình */}
            <div className="p-5 bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#7B6E64]">
                  Mức Chi tiêu Bình quân Toàn hệ thống (AVG Subquery Base)
                </span>
                <div className="font-serif text-3xl text-[#0D0703] font-medium mt-1 tabular-nums">
                  {formatVND(averageSpent)}
                </div>
                <p className="font-sans text-xs text-[#7B6E64] mt-1">
                  Chỉ tính trên tập các khách hàng đã từng phát sinh đơn hàng thành công.
                </p>
              </div>

              <div className="px-4 py-2 bg-white border border-[#D2C8BA] rounded-[2px] text-right">
                <span className="font-mono text-[10px] text-[#A7824B] uppercase tracking-wider font-bold">
                  Số lượng Khách VIP vượt ngưỡng
                </span>
                <div className="font-serif text-2xl text-[#0D0703] font-medium mt-0.5">
                  {topCustomers.length} khách hàng
                </div>
              </div>
            </div>

            {/* Bảng danh sách khách VIP */}
            <div className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] overflow-hidden">
              <div className="p-4 border-b border-[#D2C8BA]/60 flex items-center justify-between">
                <h3 className="font-serif text-lg text-[#0D0703] font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A7824B]" />
                  <span>Danh sách Khách hàng VIP</span>
                </h3>
                <span className="font-mono text-xs text-[#7B6E64]">
                  Sắp xếp theo tổng chi tiêu giảm dần
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#D2C8BA] bg-[#EAE4D9]/40 text-[#503625] font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Khách hàng</th>
                      <th className="py-3 px-4">Hạng Thành viên</th>
                      <th className="py-3 px-4 text-right">Tổng Chi tiêu</th>
                      <th className="py-3 px-4 text-right">Vượt mức Trung bình</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2C8BA]/40 font-sans text-xs">
                    {topCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#7B6E64]">
                          Chưa có khách hàng nào chi tiêu vượt mức trung bình.
                        </td>
                      </tr>
                    ) : (
                      topCustomers.map((cust, index) => {
                        const diff = cust.totalSpent - averageSpent;
                        return (
                          <tr key={cust.customerId} className="hover:bg-[#FAF8F3]/60 transition-colors">
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#A7824B]">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-[#0D0703]">{cust.fullName}</div>
                              <span className="font-mono text-[10px] text-[#7B6E64]">
                                ID: #{cust.customerId}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2.5 py-0.5 bg-[#271E18] text-[#FAF8F3] font-mono text-[10px] uppercase tracking-wider rounded-[1px] font-bold">
                                {cust.tierName}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-[#0D0703] tabular-nums text-sm">
                              {formatVND(cust.totalSpent)}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-mono text-green-700 font-medium">
                              +{formatVND(diff)}
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
        )}
      </div>
    </AdminLayout>
  );
};
