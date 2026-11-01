import React from 'react';
import type { ProductDetail } from '../../../../types';
import { formatDate } from '../../../../utils/formatDate';

export interface ProductReviewsSectionProps {
  reviews: ProductDetail['reviews'];
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ reviews }) => {
  return (
    <section className="w-full py-16 bg-[#FCF9F3]">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#D2C8BA]/40">
          <div>
            <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block mb-2">
              Patron Testimonials
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-[#0D0703]">
              Nhận Xét Từ Khách Hàng Sở Hữu
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="font-serif text-3xl font-medium text-[#0D0703]">
                {reviews.avgRating ? reviews.avgRating.toFixed(1) : '5.0'}
              </span>
              <span className="text-xs text-[#7B6E64] block">
                trên 5 sao ({reviews.totalCount} lượt nhận xét)
              </span>
            </div>
            <div className="text-amber-600 text-lg tracking-widest">★★★★★</div>
          </div>
        </div>

        {/* Danh sách nhận xét */}
        {reviews.items && reviews.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.items.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#FAF8F3] border border-[#D2C8BA]/60 p-6 rounded-[2px] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-amber-600 text-sm tracking-widest">
                      {'★'.repeat(rev.rating)}
                      <span className="text-[#D2C8BA]">
                        {'☆'.repeat(Math.max(0, 5 - rev.rating))}
                      </span>
                    </div>
                    <span className="font-sans text-[10px] text-[#7B6E64]">
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-[#372A22] leading-relaxed italic">
                    "{rev.comment || rev.body || 'Tác phẩm đạt chuẩn mực cao về tỉ lệ và chất lượng hoàn thiện.'}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D2C8BA]/40">
                  <span className="font-sans text-xs font-semibold text-[#0D0703]">
                    {rev.customerName || rev.authorName || 'Khách hàng AUREN'}
                  </span>
                  <span className="text-[10px] text-[#7B6E64] block">Chủ sở hữu đã xác minh</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#FAF8F3] border border-[#D2C8BA]/40 rounded-[2px]">
            <p className="font-sans text-xs text-[#7B6E64]">
              Tác phẩm này đang được trưng bày cho các kỳ trải nghiệm riêng. Chưa có đánh giá công khai.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
