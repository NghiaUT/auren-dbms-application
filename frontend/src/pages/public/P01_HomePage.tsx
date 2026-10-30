// ============================================================================
// File: frontend/src/pages/public/P01_HomePage.tsx
// Mã màn hình: P01 | Route: / | FR: FR2
// Vai trò: Trang chủ công khai chuẩn Stitch AUREN Architectural Design:
//          - Hero Banner kiến trúc toàn màn hình (Full-bleed Hero)
//          - 01: Bộ sưu tập tuyển chọn với lưới bất đối xứng 12 cột (The Collection)
//          - 02: Bảng chất liệu chế tác bố cục chia đôi (50/50 Materiality Split)
//          - 03: Triết lý thiết kế & xưởng mộc (Our Approach)
//          - 04: Lưu trữ tạp chí & bài viết kiến trúc (Studio Archive / Journal)
//          - 05: Lời mời tham quan phòng trưng bày (Showrooms)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../../components/common';
import {
  FEATURED_COLLECTION,
  JOURNAL_ARTICLES,
  MATERIALS_CATALOG,
} from '../../data/mockData';
import { getFeaturedProductsApi } from '../../api/catalog.api';
import type { ProductSummary } from '../../types';

export interface P01_HomePageProps {
  readonly initialProducts?: ProductSummary[];
}

export const P01_HomePage: React.FC<P01_HomePageProps> = ({ initialProducts }) => {
  const [products, setProducts] = useState<readonly ProductSummary[]>(
    initialProducts || FEATURED_COLLECTION,
  );

  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      const apiProducts = await getFeaturedProductsApi();
      if (isMounted && apiProducts && apiProducts.length > 0) {
        setProducts(apiProducts);
      }
    }
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full">
      {/* ═════════════════════════════════════════════════════════════
          1. HERO SECTION (Full-bleed, 850px min-height, 12-col bottom anchor)
      ═════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] lg:min-h-[95vh] w-full flex items-end justify-center overflow-hidden bg-[#271E18]">
        {/* Background Media */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=2160&q=88&auto=format&fit=crop"
            alt="Calm architectural interior with natural light, warm walnut millwork and linen upholstery"
            fetchPriority="high"
            className="w-full h-full object-cover opacity-90 scale-100"
          />
          {/* Ambient Espresso Scrim Overlay */}
          <div className="absolute inset-0 bg-[#271E18]/46"></div>
          {/* Subtle bottom gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0703]/85 via-[#0D0703]/30 to-transparent"></div>
        </div>

        {/* Hero Content Anchor */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20 lg:pb-24 pt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            {/* Left 7 Columns: Headline */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <span className="eyebrow eyebrow-light">Architectural Furnishings · Est. 2019</span>
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.75rem] font-normal leading-[1.02] lg:leading-[0.96] tracking-[-0.015em] text-[#FAF8F3] max-w-2xl">
                Furniture for spaces that endure.
              </h1>
            </div>

            {/* Right 5 Columns: Lead Description & Dual CTAs */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-[#FAF8F3]/85 lg:pl-4">
              <p className="font-sans text-sm sm:text-base leading-relaxed text-[#FAF8F3]/80">
                Những tác phẩm định hình bằng chất liệu mộc, tỷ lệ kinh điển và thử thách của thời gian.
                Kiến tạo cho chốn an cư tĩnh tại và không gian kiến trúc trường tồn.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a href="#collection" className="btn-auren-light">
                  Khám phá bộ sưu tập
                </a>
                <a href="#craft" className="text-[#FAF8F3] arrow-link hover:text-white">
                  Tìm hiểu nghệ thuật chế tác →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          2. 01 — THE COLLECTION (Asymmetric 12-col editorial layout)
      ═════════════════════════════════════════════════════════════ */}
      <section id="collection" className="py-20 lg:py-28 max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 pb-8 border-b border-[#D2C8BA]/60 items-end">
          <div className="lg:col-span-6 flex flex-col gap-2">
            <span className="eyebrow">01 — Selected pieces</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0D0703]">
              The Collection
            </h2>
          </div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <p className="font-sans text-xs sm:text-sm text-[#7B6E64] max-w-md leading-relaxed">
              Mỗi thiết kế là một nghiên cứu cân bằng hình khối, chế tác thủ công từ các loại gỗ rừng bền
              vững, đá tự nhiên và sợi dệt mộc nguyên bản.
            </p>
            <Link to="/products" className="arrow-link whitespace-nowrap">
              Xem tất cả mẫu thiết kế →
            </Link>
          </div>
        </div>

        {/* Asymmetric Product Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {products.map((product, idx) => {
            // Xác định độ rộng cột theo bố cục Stitch:
            // Item 1: 7 cols, Item 2: 5 cols, Item 3: 4 cols, Item 4: 4 cols, Item 5: 4 cols, Item 6: 7 cols, Item 7: 5 cols
            const colSpanMap: Record<number, string> = {
              0: 'md:col-span-7',
              1: 'md:col-span-5',
              2: 'md:col-span-4',
              3: 'md:col-span-4',
              4: 'md:col-span-4',
              5: 'md:col-span-7',
              6: 'md:col-span-5',
            };
            const colClass = colSpanMap[idx] || (product.colSpan ? `md:col-span-${product.colSpan}` : 'md:col-span-4');

            return <ProductCard key={product.id} product={product} className={colClass} />;
          })}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          3. 02 — MATERIALS (Split 50/50: Photo Left, Walnut Wood Right)
      ═════════════════════════════════════════════════════════════ */}
      <section id="materials" className="w-full bg-[#503625] text-[#FAF8F3]">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
          {/* Left Pane: Full-height Material Photo (6 cols) */}
          <div className="lg:col-span-6 h-80 lg:h-auto relative overflow-hidden bg-[#271E18]">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1400&q=85&auto=format&fit=crop"
              alt="Close-up of premium raw walnut hardwood showing fine longitudinal grain"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Pane: Background Walnut with Numbered Catalog (6 cols) */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <span className="eyebrow eyebrow-light">02 — Materiality</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mt-2 mb-4 text-[#FAF8F3]">
              Made to be lived with.
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#FAF8F3]/75 leading-relaxed max-w-xl mb-10">
              Mỗi bề mặt chứa đựng câu chuyện về nơi nó bắt đầu. Chúng tôi chọn vật liệu không vì vẻ hoàn
              hảo tạm thời, mà vì chân lý kết cấu và năng lực lắng đọng ngày một ấm áp, đằm sâu cùng nhịp
              sống thường nhật.
            </p>

            {/* Numbered Table */}
            <div className="flex flex-col divide-y divide-[#FAF8F3]/15 border-t border-b border-[#FAF8F3]/15">
              {MATERIALS_CATALOG.map((mat) => (
                <div key={mat.id} className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                  <span className="sm:col-span-2 font-mono text-xs text-[#A7824B] tracking-widest font-semibold">
                    {mat.num}
                  </span>
                  <h3 className="sm:col-span-4 font-serif text-lg text-[#FAF8F3]">
                    {mat.name}
                  </h3>
                  <p className="sm:col-span-6 font-sans text-xs text-[#FAF8F3]/70 leading-relaxed">
                    {mat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          4. 03 — OUR APPROACH (Asymmetric: 7 cols Image, 5 cols Text)
      ═════════════════════════════════════════════════════════════ */}
      <section id="craft" className="py-20 lg:py-28 max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Workshop Image (7 cols) */}
          <div className="lg:col-span-7 overflow-hidden rounded-[2px] bg-[#EAE4D9] ratio-4-3">
            <img
              src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1400&q=85&auto=format&fit=crop"
              alt="AUREN artisan atelier with natural daylight and precision hand plane joinery"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Editorial Narrative Text (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <span className="eyebrow">03 — Our approach</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#0D0703] leading-tight">
              Objects with a sense of place.
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#7B6E64] leading-relaxed">
              AUREN khởi xướng từ một niềm tin tĩnh lặng: những vật phẩm hiện diện trong thánh đường tổ ấm
              cần mang lại sự an yên thay vì tiếng ồn thị giác. Mọi kích thước đều bắt nguồn từ tỷ lệ
              kiến trúc cổ điển, cho phép mỗi tác phẩm hòa quyện tự nhiên trong mọi thể tích không gian.
            </p>
            <p className="font-sans text-xs sm:text-sm text-[#7B6E64] leading-relaxed">
              Chúng tôi cự tuyệt chu kỳ chạy đua theo xu hướng ngắn hạn. Kết hợp mộng gỗ đa trục chuẩn xác
              với lớp dầu lau thủ công, nội thất AUREN được sinh ra để gắn bó bền bỉ qua nhiều thế hệ.
            </p>
            <div className="pt-2">
              <a href="#showroom" className="arrow-link">
                Trải nghiệm tại Showroom →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          5. 04 — JOURNAL (Studio Archive: 1 Lead + 2 Side Articles)
      ═════════════════════════════════════════════════════════════ */}
      <section id="journal" className="py-20 bg-[#F7F4EE] border-t border-b border-[#D2C8BA]/60">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-[#D2C8BA]/60 gap-4">
            <div>
              <span className="eyebrow">04 — Studio Archive</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#0D0703] mt-1">Journal</h2>
            </div>
            <a href="#journal" className="arrow-link">
              Tất cả bài viết (24) →
            </a>
          </div>

          {/* Article Grid */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Story 1: Lead (6 cols) */}
            {JOURNAL_ARTICLES.filter((a) => a.isLead).map((story) => (
              <article key={story.id} className="md:col-span-6 flex flex-col justify-between group">
                <div>
                  <div className="overflow-hidden rounded-[2px] bg-[#EAE4D9] ratio-4-3">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <span className="eyebrow mt-4 mb-2 text-[10px]">{story.category}</span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#0D0703] group-hover:text-[#503625] transition-colors leading-snug">
                    {story.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-[#7B6E64] mt-2 leading-relaxed">
                    {story.excerpt}
                  </p>
                </div>
                <div className="mt-4">
                  <span className="arrow-link">Đọc bài viết →</span>
                </div>
              </article>
            ))}

            {/* Story 2 & 3: Supporting (3 cols each) */}
            {JOURNAL_ARTICLES.filter((a) => !a.isLead).map((story) => (
              <article key={story.id} className="md:col-span-3 flex flex-col justify-between group">
                <div>
                  <div className="overflow-hidden rounded-[2px] bg-[#EAE4D9] ratio-3-4">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <span className="eyebrow mt-4 mb-2 text-[10px]">{story.category}</span>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#0D0703] group-hover:text-[#503625] transition-colors leading-snug">
                    {story.title}
                  </h3>
                  <p className="font-sans text-xs text-[#7B6E64] mt-2 leading-relaxed line-clamp-3">
                    {story.excerpt}
                  </p>
                </div>
                <div className="mt-4">
                  <span className="arrow-link">Đọc bài viết →</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          6. 05 — SHOWROOM (Full-bleed card, text bottom anchored)
      ═════════════════════════════════════════════════════════════ */}
      <section id="showroom" className="relative min-h-[550px] w-full flex items-end bg-[#271E18] text-[#FAF8F3]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=2160&q=88&auto=format&fit=crop"
            alt="AUREN studio showroom in Stockholm with curated solid timber pieces and ambient light"
            loading="lazy"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[#271E18]/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0703]/90 via-[#0D0703]/30 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 flex flex-col gap-2">
              <span className="eyebrow eyebrow-light">
                Stockholm · Milan · London · Đặt lịch hẹn trước
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#FAF8F3]">
                Come see the collection.
              </h2>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <p className="font-sans text-xs sm:text-sm text-[#FAF8F3]/80 leading-relaxed">
                Trực tiếp chạm vào trọng lượng của gỗ óc chó nguyên khối, sự êm dịu của vải lanh giặt mộc
                và chiêm ngưỡng cách ánh sáng ban mai thắp sáng hình thái kiến trúc.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="mailto:concierge@auren-studio.com" className="btn-auren-light">
                  Đặt lịch hẹn riêng
                </a>
                <a href="mailto:concierge@auren-studio.com" className="arrow-link text-[#FAF8F3] hover:text-white">
                  Liên hệ Quản gia AUREN →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
