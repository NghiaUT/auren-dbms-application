// ============================================================================
// File: frontend/src/pages/public/P03_ProductDetailPage.tsx
// Mã màn hình: P03 | Route: /products/:id | FR: FR4, FR10 (xem)
// Vai trò: Chi tiết tác phẩm nội thất — Chuyển hoá chính xác từ bản thiết kế
//          Stitch .stitch/designs/p03-product-detail.html:
//          - Thư viện ảnh kiến trúc bất đối xứng (Hero 4:5, Macro 1:1, In-situ 16:10)
//          - Bộ chọn biến thể (VariantPicker) cập nhật giá động theo quy cách
//          - Bảng tồn kho theo Showroom & Kho (Thực thi triệt để FR4 - ROLE_MATRIX)
//          - Phân rã tỉ lệ vật liệu tự nhiên (Materiality Breakdown)
//          - Các tab Accordion thông số, kích thước, White-Glove và bảo quản
//          - Khối Tectonic Integrity (Anatomy of Permanence)
//          - Đánh giá từ khách hàng (FR10) & Hộp thoại Concierge Private Viewing
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VariantPicker } from '../../components/VariantPicker';
import { getProductDetailApi } from '../../api/catalog.api';
import { useAuth } from '../../auth/useAuth';
import type { ProductDetail, Variant } from '../../types';
import { formatVND } from '../../utils/formatVND';
import { formatDate } from '../../utils/formatDate';
import { addToCart } from '../../utils/cartStorage';

export const P03_ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion state
  const [activeAccordion, setActiveAccordion] = useState<string | null>('acc-dims');

  // Modal & Toast states
  const [viewingModalOpen, setViewingModalOpen] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Private viewing appointment form
  const [viewingForm, setViewingForm] = useState({
    gallery: 'Showroom Flagship Tràng Tiền, Hoàn Kiếm, Hà Nội',
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    note: '',
  });

  // Tải chi tiết sản phẩm
  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setError('Mã tác phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getProductDetailApi(productId, 10)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Lỗi khi tải chi tiết sản phẩm:', err);
        setError('Tác phẩm nội thất không tồn tại hoặc đã ngừng trưng bày.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, isAuthenticated]);

  // Bộ ảnh chất lượng cao gán cho tác phẩm
  const galleryImages = useMemo(() => {
    const mainImg = product?.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=85&auto=format&fit=crop';
    return {
      hero: mainImg,
      macro1: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop',
      macro2: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80&auto=format&fit=crop',
      insitu: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400&q=85&auto=format&fit=crop',
    };
  }, [product]);

  // Thêm vào giỏ hàng (Shopping Bag)
  const handleAddToBag = () => {
    if (!product || !selectedVariant) return;

    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantFinish: selectedVariant.finish,
      variantSize: selectedVariant.size,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      imageUrl: galleryImages.hero,
      designerName: product.designerName,
      collectionName: product.collectionName,
    }, 1);

    setToastMessage(`${product.name} (${selectedVariant.finish}) đã được thêm vào bộ sưu tập.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Xử lý gửi biểu mẫu hẹn lịch trải nghiệm riêng
  const handleViewingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setViewingModalOpen(false);
    alert(`Cảm ơn Quý khách ${viewingForm.fullName}. Bộ phận Giám tuyển AUREN sẽ liên hệ qua email ${viewingForm.email} trong vòng 24 giờ để xác nhận buổi tiếp đón riêng tại ${viewingForm.gallery}.`);
  };

  // Toggle Accordion
  const toggleAccordion = (key: string) => {
    setActiveAccordion((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return (
      <div className="pt-28 pb-24 max-w-[1600px] mx-auto px-6 md:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-7 aspect-[4/5] bg-[#EAE4D9] rounded-[2px]" />
          <div className="lg:col-span-5 space-y-6">
            <div className="h-4 bg-[#EAE4D9] w-1/3 rounded" />
            <div className="h-10 bg-[#EAE4D9] w-3/4 rounded" />
            <div className="h-8 bg-[#EAE4D9] w-1/2 rounded" />
            <div className="h-32 bg-[#EAE4D9] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-28 pb-24 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4 bg-[#FAF8F3] p-10 border border-[#D2C8BA] rounded-[2px]">
          <h2 className="font-serif text-3xl text-[#0D0703]">Không tìm thấy tác phẩm</h2>
          <p className="font-sans text-xs text-[#7B6E64] leading-relaxed">
            {error || 'Tác phẩm bạn đang tìm kiếm không tồn tại hoặc đã được gỡ khỏi lưu trữ.'}
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-[#271E18] text-[#FAF8F3] font-sans text-xs uppercase tracking-widest hover:bg-[#0D0703] transition-colors rounded-[2px]"
            >
              Trở về Bộ sưu tập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-20">
      {/* ============================================================ */}
      {/* Subtle Breadcrumb & Edition Tracking Bar                     */}
      {/* ============================================================ */}
        <section className="w-full bg-[#F6F3ED] py-4 border-b border-[#D2C8BA]/30">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 flex flex-wrap items-center justify-between gap-y-2">
            <nav aria-label="Breadcrumb" className="flex items-center gap-3">
              <Link to="/products" className="font-sans text-[11px] text-[#7B6E64] hover:text-[#0D0703] transition-colors tracking-widest uppercase">
                Bộ sưu tập
              </Link>
              <span className="text-[#7B6E64]/40 font-serif text-xs">/</span>
              <span className="font-sans text-[11px] text-[#7B6E64] uppercase tracking-widest">
                {product.category?.name || 'Nội thất'}
              </span>
              <span className="text-[#7B6E64]/40 font-serif text-xs">/</span>
              <span className="font-sans text-[11px] text-[#0D0703] font-semibold tracking-widest uppercase truncate max-w-xs">
                {product.name}
              </span>
            </nav>

            <div className="hidden sm:flex items-center gap-4 text-[#7B6E64]">
              {selectedVariant && (
                <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
                  Ref. {selectedVariant.sku}
                </span>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-[#A58548]"></span>
              <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#4E4540]">
                {product.brand?.name} Atelier
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Main Hero Product Presentation Section (7 / 5 cols)         */}
        {/* ============================================================ */}
        <section className="w-full py-8 lg:py-16">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              
              {/* CỘT TRÁI: THƯ VIỆN ẢNH KIẾN TRÚC BẤT ĐỐI XỨNG (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* 1. Primary Hero Photo (4:5) */}
                <div className="relative w-full aspect-[4/5] bg-[#EAE4D9] overflow-hidden group shadow-sm rounded-[2px]">
                  <img
                    src={galleryImages.hero}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-6 left-6 bg-[#271E18]/80 backdrop-blur-md px-4 py-2 text-[#FAF8F3] rounded-[1px]">
                    <span className="font-sans text-[10px] uppercase tracking-widest">
                      Bản khắc 01 // Góc nghiêng trực diện
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoomImage(galleryImages.hero)}
                    aria-label="Phóng to ảnh kiến trúc"
                    className="absolute top-6 right-6 w-10 h-10 bg-[#FCF9F3]/80 backdrop-blur-md text-[#0D0703] flex items-center justify-center hover:bg-[#FCF9F3] transition-colors shadow-sm rounded-[1px]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>

                {/* 2. Secondary Macro Details (1:1) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="relative aspect-square bg-[#EAE4D9] overflow-hidden group shadow-sm rounded-[2px]">
                    <img
                      src={galleryImages.macro1}
                      alt="Chi tiết mộng gỗ"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute bottom-4 left-4 bg-[#271E18]/80 backdrop-blur-sm px-3 py-1.5 text-[#FAF8F3] rounded-[1px]">
                      <span className="font-sans text-[10px] uppercase tracking-widest">
                        Bản khắc 02 // Khớp nối mộng âm dương
                      </span>
                    </div>
                  </div>

                  <div className="relative aspect-square bg-[#EAE4D9] overflow-hidden group shadow-sm rounded-[2px]">
                    <img
                      src={galleryImages.macro2}
                      alt="Bề mặt da thuộc thảo mộc"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute bottom-4 left-4 bg-[#271E18]/80 backdrop-blur-sm px-3 py-1.5 text-[#FAF8F3] rounded-[1px]">
                      <span className="font-sans text-[10px] uppercase tracking-widest">
                        Bản khắc 03 // Đường chỉ khâu yên ngựa
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. In-situ Spatial Context (16:10) */}
                <div className="relative aspect-[16/10] bg-[#EAE4D9] overflow-hidden group shadow-sm rounded-[2px]">
                  <img
                    src={galleryImages.insitu}
                    alt="Không gian kiến trúc thực tế"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-6 left-6 bg-[#271E18]/80 backdrop-blur-md px-4 py-2 text-[#FAF8F3] rounded-[1px]">
                    <span className="font-sans text-[10px] uppercase tracking-widest">
                      Bản khắc 04 // Bối cảnh không gian — Biệt viện Klampenborg
                    </span>
                  </div>
                </div>

                {/* 4. Architectural Blueprint Card */}
                <div className="bg-[#F6F3ED] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm rounded-[2px] border border-[#D2C8BA]/40">
                  <div className="space-y-2">
                    <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block">
                      Architectural Blueprint
                    </span>
                    <h4 className="font-serif text-2xl text-[#0D0703]">Hồ sơ Bản vẽ &amp; Tham số 3D</h4>
                    <p className="font-sans text-xs text-[#4E4540] max-w-md leading-relaxed">
                      Bản vẽ mặt đứng trực giao, phân bổ trọng tâm và tệp mô hình 3D (STEP / OBJ / DWG) dành riêng cho kiến trúc sư và nhà thiết kế nội thất.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => alert('Tệp 3D CAD Pack (STEP/OBJ) đã được đóng gói và sẵn sàng gửi qua email concierge của quý khách.')}
                      className="bg-[#FCF9F3] border border-[#D2C8BA] px-4 py-2.5 text-[#0D0703] hover:bg-[#EAE4D9] transition-colors font-sans text-xs uppercase tracking-widest flex items-center gap-2 rounded-[2px]"
                    >
                      <svg className="w-3.5 h-3.5 text-[#A7824B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Tải 3D CAD (.zip)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Hồ sơ kỹ thuật Tear Sheet PDF đã tải thành công.')}
                      className="bg-[#FCF9F3] border border-[#D2C8BA] px-4 py-2.5 text-[#0D0703] hover:bg-[#EAE4D9] transition-colors font-sans text-xs uppercase tracking-widest flex items-center gap-2 rounded-[2px]"
                    >
                      <svg className="w-3.5 h-3.5 text-[#A7824B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Tear Sheet (PDF)</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* CỘT PHẢI: KHỐI THƯƠNG MẠI & CẤU HÌNH STICKY (5 cols) */}
              <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
                
                {/* Header Tiêu đề & Giá bán */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em]">
                      {product.collectionName ? `${product.collectionName} • ` : ''}Kỳ phát hành 2026
                    </span>
                    {product.isLimited && (
                      <span className="bg-[#EAE4D9] px-2.5 py-1 text-[#4E4540] font-sans text-[10px] tracking-wider uppercase rounded-[1px]">
                        Bản Đánh Số Giới Hạn
                      </span>
                    )}
                  </div>

                  <h1 className="font-serif text-4xl sm:text-5xl text-[#0D0703] tracking-tight font-normal leading-tight">
                    {product.name}
                  </h1>

                  {product.designerName && (
                    <p className="font-sans text-xs text-[#7B6E64] uppercase tracking-wider">
                      Thiết kế bởi: <strong className="text-[#0D0703]">{product.designerName}</strong>
                    </p>
                  )}

                  <div className="flex items-baseline gap-4 pt-2">
                    <span className="font-serif text-3xl sm:text-4xl text-[#0D0703] font-normal tabular-nums">
                      {selectedVariant ? formatVND(selectedVariant.price) : formatVND(product.minPrice)}
                    </span>
                    <span className="font-sans text-[10px] text-[#7B6E64] uppercase tracking-wider">
                      Đã bao gồm thuế • Lắp đặt White-Glove
                    </span>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-[#4E4540] pt-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Bộ chọn biến thể (VariantPicker) */}
                {selectedVariant && (
                  <div className="bg-[#F6F3ED] p-6 shadow-sm rounded-[2px] border border-[#D2C8BA]/40 space-y-6">
                    <VariantPicker
                      variants={product.variants}
                      selectedVariant={selectedVariant}
                      onSelect={(v) => setSelectedVariant(v)}
                    />

                    {/* Phân rã vật liệu của biến thể được chọn */}
                    {selectedVariant.materials && selectedVariant.materials.length > 0 && (
                      <div className="pt-4 border-t border-[#D2C8BA]/40 space-y-2">
                        <span className="font-sans text-[10px] font-semibold text-[#0D0703] uppercase tracking-widest block">
                          Phân bổ tỉ lệ chất liệu tự nhiên:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedVariant.materials.map((m) => (
                            <span
                              key={m.materialId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FCF9F3] border border-[#D2C8BA] font-sans text-[11px] text-[#372A22] rounded-[1px]"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#A58548]"></span>
                              <strong>{m.name}</strong>
                              {m.pct && <span className="text-[#7B6E64]">({m.pct}%)</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================ */}
                {/* [FR4] TỒN KHO THEO SHOWROOM & KHO (ROLE_MATRIX STRICT CHECK)  */}
                {/* ============================================================ */}
                <div className="bg-[#FAF8F3] border border-[#D2C8BA]/60 p-5 rounded-[2px] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703]">
                      Hiện diện tại Showroom &amp; Kho lưu trữ
                    </h4>
                    {isAuthenticated ? (
                      <span className="font-sans text-[10px] text-[#A7824B] uppercase tracking-wider">
                        Phiên xác thực ({user?.role})
                      </span>
                    ) : (
                      <Link
                        to="/login"
                        className="font-sans text-[10px] text-[#A7824B] underline tracking-wider uppercase hover:text-[#503625]"
                      >
                        Đăng nhập để xem số lượng
                      </Link>
                    )}
                  </div>

                  {selectedVariant?.stock && selectedVariant.stock.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {selectedVariant.stock.map((s) => (
                        <div
                          key={s.locationId}
                          className="flex items-center justify-between py-1.5 px-3 bg-[#FCF9F3] border border-[#D2C8BA]/30 rounded-[1px] text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                s.inStock ? 'bg-emerald-600' : 'bg-[#D2C8BA]'
                              }`}
                            />
                            <span className="text-[#0D0703] font-medium">{s.locationName}</span>
                            <span className="text-[10px] text-[#7B6E64]">({s.city})</span>
                          </div>

                          <div>
                            {/* Quyền Guest: s.available là null, chỉ hiển thị cờ inStock */}
                            {s.available === null ? (
                              <span
                                className={`font-sans text-[11px] ${
                                  s.inStock ? 'text-emerald-700 font-medium' : 'text-[#7B6E64]'
                                }`}
                              >
                                {s.inStock ? 'Sẵn sàng tại điểm' : 'Hết hàng tạm thời'}
                              </span>
                            ) : (
                              /* Quyền Authenticated: hiển thị số lượng khả dụng cụ thể */
                              <span
                                className={`font-sans text-xs font-semibold tabular-nums ${
                                  (s.available || 0) > 0 ? 'text-emerald-800' : 'text-[#7B6E64]'
                                }`}
                              >
                                {(s.available || 0) > 0
                                  ? `Còn ${s.available} sản phẩm`
                                  : '0 sản phẩm'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-sans text-xs text-[#7B6E64]">
                      Đang liên hệ xưởng chế tác để xác nhận số lượng tồn kho.
                    </p>
                  )}
                </div>

                {/* Banner thời gian chế tác */}
                <div className="flex items-center gap-3 bg-[#EAE4D9]/60 p-4 rounded-[2px]">
                  <svg className="w-5 h-5 text-[#A58548] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="font-sans text-xs font-semibold text-[#0D0703]">
                      Chế tác thủ công theo yêu cầu tại Atelier
                    </p>
                    <p className="font-sans text-[11px] text-[#4E4540]">
                      {selectedVariant?.leadTimeDays
                        ? `Thời gian hoàn thiện dự kiến: ${selectedVariant.leadTimeDays} ngày`
                        : 'Tiêu chuẩn hoàn thiện 4–6 tuần'} • Gỗ chứng nhận bền vững FSC
                    </p>
                  </div>
                </div>

                {/* Purchase & Inquiry CTAs */}
                <div className="space-y-3">
                  {product.isLimited && selectedVariant && (
                    <Link
                      to={`/limited/${selectedVariant.id}`}
                      className="w-full bg-[#A58548] text-[#FAF8F3] py-4 px-6 text-center font-sans text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#8F723C] transition-all duration-300 shadow-md flex items-center justify-center gap-2 rounded-[2px]"
                    >
                      <span>★ Mua bản Limited Edition (Đánh số độc bản)</span>
                    </Link>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleAddToBag}
                      className="flex-1 bg-[#271E18] text-[#FAF8F3] py-4 px-6 text-center font-sans text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#0D0703] transition-all duration-300 shadow-md active:translate-y-0.5 flex items-center justify-center gap-2 rounded-[2px]"
                    >
                      <svg className="w-4 h-4 text-[#A58548]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>
                        Đưa vào bộ sưu tập • {selectedVariant ? formatVND(selectedVariant.price) : ''}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewingModalOpen(true)}
                      className="bg-[#FAF8F3] hover:bg-[#F0EEE8] text-[#0D0703] border border-[#D2C8BA] py-4 px-6 font-sans text-xs font-semibold uppercase tracking-[0.16em] transition-colors flex items-center justify-center gap-2 rounded-[2px]"
                    >
                      <svg className="w-4 h-4 text-[#A58548]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Trải nghiệm riêng</span>
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-between text-[#7B6E64] pt-1 text-[10px] uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#A58548]">✓</span>
                    <span>Bảo hành kết cấu trọn đời</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#A58548]">✓</span>
                    <span>Lắp đặt White-Glove</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#A58548]">✓</span>
                    <span>Thanh toán ký quỹ</span>
                  </div>
                </div>

                {/* Architectural Accordion Tabs */}
                <div className="space-y-2 pt-4">
                  {/* Item 1: Dimensions */}
                  <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('acc-dims')}
                      className="w-full p-4 flex items-center justify-between text-left group"
                    >
                      <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
                        Kích thước • Trọng lượng kiến trúc
                      </span>
                      <span className={`text-[#0D0703] transform transition-transform duration-300 ${activeAccordion === 'acc-dims' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {activeAccordion === 'acc-dims' && (
                      <div className="px-4 pb-6 space-y-4 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#FCF9F3] p-3 border border-[#D2C8BA]/30 rounded-[1px]">
                            <span className="font-sans text-[10px] uppercase tracking-widest text-[#7B6E64]">Quy cách kích thước</span>
                            <p className="font-serif text-lg text-[#0D0703] mt-0.5">
                              {product.dimensions || selectedVariant?.size || 'Tiêu chuẩn'}
                            </p>
                          </div>
                          <div className="bg-[#FCF9F3] p-3 border border-[#D2C8BA]/30 rounded-[1px]">
                            <span className="font-sans text-[10px] uppercase tracking-widest text-[#7B6E64]">Khoảng lọt lòng tối thiểu</span>
                            <p className="font-serif text-lg text-[#0D0703] mt-0.5">
                              45 cm từ vách tĩnh
                            </p>
                          </div>
                        </div>
                        <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
                          Các thông số được hiệu chuẩn chính xác để đảm bảo lưu thông khí và ánh sáng tự nhiên trong phòng khách hoặc phòng làm việc.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Item 2: Materials & Provenance */}
                  <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('acc-mats')}
                      className="w-full p-4 flex items-center justify-between text-left group"
                    >
                      <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
                        Nguồn gốc vật liệu • Chứng chỉ khai thác
                      </span>
                      <span className={`text-[#0D0703] transform transition-transform duration-300 ${activeAccordion === 'acc-mats' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {activeAccordion === 'acc-mats' && (
                      <div className="px-4 pb-6 space-y-3 pt-1 font-sans text-xs text-[#4E4540] leading-relaxed">
                        <p>
                          <strong>Gỗ óc chó đen Bắc Mỹ (Juglans nigra):</strong> Khai thác từ các khu rừng trồng tái sinh có kiểm soát tại Pennsylvania. Sấy lò hơn 40 ngày để đạt độ ẩm cân bằng 7%, triệt tiêu co ngót trước điều kiện khí hậu nhiệt đới.
                        </p>
                        <p>
                          <strong>Da thuộc thảo mộc:</strong> Da bò nguyên tấm từ xưởng thuộc truyền thống tại Scandinavia, sử dụng tannin chiết xuất từ vỏ cây keo (mimosa) và hạt dẻ, không sử dụng muối crom độc hại.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Item 3: Delivery */}
                  <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('acc-ship')}
                      className="w-full p-4 flex items-center justify-between text-left group"
                    >
                      <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
                        Giao nhận &amp; Lắp đặt White-Glove
                      </span>
                      <span className={`text-[#0D0703] transform transition-transform duration-300 ${activeAccordion === 'acc-ship' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {activeAccordion === 'acc-ship' && (
                      <div className="px-4 pb-6 space-y-3 pt-1 font-sans text-xs text-[#4E4540] leading-relaxed">
                        <p>
                          Mỗi tác phẩm được bao bọc trong thùng gỗ thông bảo vệ tái sử dụng. Đội ngũ chuyên viên AUREN White-Glove sẽ vận chuyển tận phòng, tháo dỡ, kiểm tra kết cấu cân bằng và thu dọn toàn bộ vật liệu đóng gói.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Item 4: Care & Longevity */}
                  <div className="bg-[#F6F3ED] rounded-[2px] border border-[#D2C8BA]/40">
                    <button
                      type="button"
                      onClick={() => toggleAccordion('acc-care')}
                      className="w-full p-4 flex items-center justify-between text-left group"
                    >
                      <span className="font-sans text-xs font-semibold uppercase tracking-widest text-[#0D0703] group-hover:text-[#A58548] transition-colors">
                        Bảo dưỡng &amp; Quá trình hình thành Patina
                      </span>
                      <span className={`text-[#0D0703] transform transition-transform duration-300 ${activeAccordion === 'acc-care' ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {activeAccordion === 'acc-care' && (
                      <div className="px-4 pb-6 space-y-3 pt-1 font-sans text-xs text-[#4E4540] leading-relaxed">
                        <p>
                          Bề mặt được hoàn thiện bằng hai lớp dầu lanh ép lạnh và sáp ong tự nhiên. Khuyến nghị quét lại sáp dưỡng chuyên dụng mỗi 18 tháng để nuôi dưỡng thớ gỗ.
                        </p>
                        <p>
                          Chất da thuộc thảo mộc sẽ tự nhiên sẫm màu và phát triển lớp ánh mật ong (patina) tuyệt đẹp qua từng năm tháng sử dụng.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Craftsmanship Spotlight: Deep Walnut Inversion (Stitch Spec) */}
        {/* ============================================================ */}
        <section className="w-full bg-[#503625] text-[#FAF8F3] py-20 lg:py-28 my-12">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
            <div className="max-w-2xl space-y-4 mb-16">
              <span className="font-sans text-[10px] font-semibold text-[#FFDDB1] tracking-[0.25em] uppercase">
                Tectonic Integrity
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl text-[#FAF8F3] tracking-tight">
                Giải Phẫu Sự Trường Tồn
              </h2>
              <p className="font-sans text-sm text-[#FAF8F3]/80 leading-relaxed">
                Mọi điểm giao nhau trong khung kết cấu AUREN đều được tính toán để triệt tiêu lực xé ngang bằng hình học vật lý thay vì keo dán hóa học.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <div className="space-y-6 bg-[#271E18]/50 p-8 rounded-[2px]">
                <div className="aspect-[4/3] bg-[#271E18]/80 overflow-hidden rounded-[1px]">
                  <img
                    src="https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=80&auto=format&fit=crop"
                    alt="Mộng chốt cơ học"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest block">
                  01 // Mộng ghép truyền thống
                </span>
                <h3 className="font-serif text-2xl text-[#FAF8F3]">Khớp Mộng Âm Dương Khóa Nêm</h3>
                <p className="font-sans text-xs text-[#FAF8F3]/70 leading-relaxed">
                  Đầu mộng xuyên suốt qua chân chịu lực, cố định bằng các nêm gỗ óc chó vát góc. Khi thời tiết giao mùa làm thớ gỗ co giãn, khớp mộng tự động siết chặt lại.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="space-y-6 bg-[#271E18]/50 p-8 rounded-[2px]">
                <div className="aspect-[4/3] bg-[#271E18]/80 overflow-hidden rounded-[1px]">
                  <img
                    src="https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80&auto=format&fit=crop"
                    alt="Thuộc da thảo mộc"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest block">
                  02 // Chiết xuất vỏ cây tự nhiên
                </span>
                <h3 className="font-serif text-2xl text-[#FAF8F3]">Ngâm Thuộc 180 Ngày</h3>
                <p className="font-sans text-xs text-[#FAF8F3]/70 leading-relaxed">
                  Da được ngâm trong bể dung dịch vỏ cây mimosa và hạt dẻ trong 6 tháng liên tục. Cho ra lớp da có độ thở tự nhiên, thơm mùi mộc và thân thiện với làn da.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="space-y-6 bg-[#271E18]/50 p-8 rounded-[2px]">
                <div className="aspect-[4/3] bg-[#271E18]/80 overflow-hidden rounded-[1px]">
                  <img
                    src="https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&q=80&auto=format&fit=crop"
                    alt="Đánh bóng sáp thủ công"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-sans text-[10px] text-[#FFDDB1] uppercase tracking-widest block">
                  03 // Đánh bóng ma sát
                </span>
                <h3 className="font-serif text-2xl text-[#FAF8F3]">Hoàn Thiện Dầu Lanh &amp; Sáp Ong</h3>
                <p className="font-sans text-xs text-[#FAF8F3]/70 leading-relaxed">
                  Không phủ bóng công nghiệp polyurethane. Bề mặt được lau 5 lần dầu lanh nguyên chất, đánh bóng bằng giẻ len khô để mang lại cảm giác mềm mượt tự nhiên.
                </p>
              </div>
            </div>

            {/* Metric Strip */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-[#FAF8F3]/10">
              <div>
                <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">42 Giờ</span>
                <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">Nghệ nhân gia công thủ công</p>
              </div>
              <div>
                <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">100 Năm</span>
                <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">Vòng đời kết cấu kiến trúc</p>
              </div>
              <div>
                <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">0%</span>
                <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">Keo dán hoá chất tổng hợp</p>
              </div>
              <div>
                <span className="font-serif text-3xl sm:text-4xl text-[#FFDDB1] font-light">3.2 kg</span>
                <p className="font-sans text-[10px] uppercase tracking-widest text-[#FAF8F3]/60 mt-1">Gỗ tái chế từ mỗi thân cây</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Customer Reviews Section (FR10 - Viewing patron reviews)     */}
        {/* ============================================================ */}
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
                    {product.reviews.avgRating ? product.reviews.avgRating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-xs text-[#7B6E64] block">
                    trên 5 sao ({product.reviews.totalCount} lượt nhận xét)
                  </span>
                </div>
                <div className="text-amber-600 text-lg tracking-widest">
                  ★★★★★
                </div>
              </div>
            </div>

            {/* Danh sách nhận xét */}
            {product.reviews.items && product.reviews.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {product.reviews.items.map((rev) => (
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
                        "{rev.body || (rev as any).comment || 'Tác phẩm đạt chuẩn mực cao về tỉ lệ và chất lượng hoàn thiện.'}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#D2C8BA]/40">
                      <span className="font-sans text-xs font-semibold text-[#0D0703]">
                        {rev.authorName || (rev as any).customerName || 'Khách hàng AUREN'}
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

        {/* ============================================================ */}
        {/* Concierge Consultation Banner                                */}
        {/* ============================================================ */}
        <section className="w-full bg-[#F0EEE8] py-16 border-t border-[#D2C8BA]/40">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
            <div className="bg-[#FAF8F3] p-8 md:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-sm rounded-[2px] border border-[#D2C8BA]/40">
              <div className="max-w-xl space-y-3">
                <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-[0.2em] block">
                  Architectural Support
                </span>
                <h3 className="font-serif text-3xl text-[#0D0703]">
                  Đặt Hàng Tùy Biến Riêng &amp; Dự Án Thiết Kế
                </h3>
                <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
                  Đối với các dự án biệt thự, penthouse hoặc chỉ định quy cách gỗ/vải đặc biệt cho khách sạn hạng sang, quý khách có thể làm việc trực tiếp với đội ngũ giám tuyển AUREN.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setViewingModalOpen(true)}
                  className="w-full sm:w-auto bg-[#271E18] text-[#FAF8F3] px-8 py-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#0D0703] transition-colors flex items-center justify-center gap-2 rounded-[2px]"
                >
                  <span>Đặt Lịch Trải Nghiệm Showroom</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Modal: Private Viewing Booking (Client Side Interactive)     */}
        {/* ============================================================ */}
        {viewingModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#271E18]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FCF9F3] max-w-lg w-full p-8 md:p-10 space-y-6 relative shadow-2xl rounded-[2px] border border-[#D2C8BA]">
              <button
                type="button"
                onClick={() => setViewingModalOpen(false)}
                className="absolute top-6 right-6 text-[#7B6E64] hover:text-[#0D0703] transition-colors"
                aria-label="Đóng hộp thoại"
              >
                ✕
              </button>

              <div className="space-y-2">
                <span className="font-sans text-[10px] font-semibold text-[#A58548] uppercase tracking-widest block">
                  Concierge Reservation
                </span>
                <h3 className="font-serif text-2xl text-[#0D0703]">Yêu Cầu Trải Nghiệm Riêng</h3>
                <p className="font-sans text-xs text-[#4E4540] leading-relaxed">
                  Trải nghiệm trực tiếp tác phẩm {product.name} tại không gian salon riêng tư với sự hướng dẫn của nghệ nhân chế tác.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleViewingSubmit}>
                <div>
                  <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
                    Showroom Tiếp Đón
                  </label>
                  <select
                    value={viewingForm.gallery}
                    onChange={(e) => setViewingForm({ ...viewingForm, gallery: e.target.value })}
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
                  >
                    <option value="Showroom Flagship Tràng Tiền, Hoàn Kiếm, Hà Nội">
                      Showroom Flagship Tràng Tiền, Hà Nội
                    </option>
                    <option value="Showroom Flagship Thảo Điền, TP. Hồ Chí Minh">
                      Showroom Flagship Thảo Điền, TP. Hồ Chí Minh
                    </option>
                    <option value="Không gian Salon Atelier Đồng Khởi, Quận 1">
                      Không gian Salon Atelier Đồng Khởi, Quận 1
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
                    Họ &amp; Tên Quý Khách
                  </label>
                  <input
                    type="text"
                    required
                    value={viewingForm.fullName}
                    onChange={(e) => setViewingForm({ ...viewingForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
                  />
                </div>

                <div>
                  <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
                    Email Liên Hệ
                  </label>
                  <input
                    type="email"
                    required
                    value={viewingForm.email}
                    onChange={(e) => setViewingForm({ ...viewingForm, email: e.target.value })}
                    placeholder="patron@domain.com"
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
                  />
                </div>

                <div>
                  <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#0D0703] block mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    value={viewingForm.phone}
                    onChange={(e) => setViewingForm({ ...viewingForm, phone: e.target.value })}
                    placeholder="0901 234 567"
                    className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-3 font-sans text-xs text-[#0D0703] focus:outline-none focus:border-[#0D0703] rounded-[2px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#271E18] text-[#FAF8F3] py-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#0D0703] transition-colors rounded-[2px]"
                >
                  Xác Nhận Đặt Lịch Hẹn
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* Fullscreen Zoom Lightbox Modal                               */}
        {/* ============================================================ */}
        {zoomImage && (
          <div
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-50 bg-[#0D0703]/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-5xl max-h-[90vh]">
              <img
                src={zoomImage}
                alt="Phóng to"
                className="max-h-[90vh] max-w-full object-contain rounded-[2px]"
              />
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="absolute top-4 right-4 text-[#FAF8F3] bg-black/50 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* Notification Toast for Add to Bag                            */}
        {/* ============================================================ */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#271E18] text-[#FAF8F3] px-6 py-4 shadow-2xl flex items-center gap-4 rounded-[2px] border border-[#A58548]/40 animate-slide-up">
            <span className="text-[#A58548] text-xl">✓</span>
            <div>
              <p className="font-sans text-xs font-medium text-[#FAF8F3]">{toastMessage}</p>
              <p className="font-sans text-[10px] text-[#FAF8F3]/70">Đã cập nhật vị thế đặt phòng White-Glove.</p>
            </div>
            <Link
              to="/cart"
              className="ml-4 font-sans text-[11px] font-semibold uppercase tracking-widest underline underline-offset-4 text-[#FFDDB1] hover:text-[#FAF8F3] whitespace-nowrap"
            >
              Xem Giỏ Hàng →
            </Link>
          </div>
        )}
    </div>
  );
};
export default P03_ProductDetailPage;
