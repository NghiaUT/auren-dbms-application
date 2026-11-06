// ============================================================================
// File: frontend/src/pages/public/P03_ProductDetailPage.tsx
// Mã màn hình: P03 | Route: /products/:id | FR: FR4, FR10 (xem)
// Vai trò: Trang chi tiết tác phẩm nội thất (Container Component) —
//          Đã phân rã thành các components con trong frontend/src/components/public/product-detail/
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductDetailApi } from '../../api/catalog.api';
import { useAuth } from '../../auth/useAuth';
import type { ProductDetail, Variant } from '../../types';
import { addToCart } from '../../utils/cartStorage';
import { useToast } from '../../context/ToastContext';

import {
  ProductBreadcrumb,
  ProductGallery,
  ProductHeader,
  ProductVariantSelector,
  ProductStockMatrix,
  ProductActions,
  ProductAccordions,
  TectonicIntegrity,
  ProductReviewsSection,
  ConciergeBanner,
  PrivateViewingModal,
  ZoomLightboxModal,
  AddToCartToast,
} from '../../components/public/product-detail';

export const P03_ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

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
    const mainImg =
      product?.imageUrl ||
      product?.images?.[0] ||
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=85&auto=format&fit=crop';
    return {
      hero: mainImg,
      macro1: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop',
      macro2: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80&auto=format&fit=crop',
      insitu: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400&q=85&auto=format&fit=crop',
    };
  }, [product]);

  // Thêm vào giỏ hàng (Shopping Bag) — Chặn tuyệt đối với Sales và Admin
  const handleAddToBag = () => {
    if (!product || !selectedVariant) return;
    if (user && (user.role === 'sales' || user.role === 'admin')) return;

    addToCart(
      {
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
      },
      1,
    );

    const cartMsg = `${product.name} (${selectedVariant.finish}) đã được thêm vào bộ sưu tập.`;
    setToastMessage(cartMsg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Xử lý gửi biểu mẫu hẹn lịch trải nghiệm riêng
  const handleViewingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setViewingModalOpen(false);
    toast.success(
      `Cảm ơn Quý khách ${viewingForm.fullName}. Bộ phận Giám tuyển AUREN sẽ liên hệ qua email ${viewingForm.email} trong vòng 24 giờ để xác nhận buổi tiếp đón riêng tại ${viewingForm.gallery}.`,
      { title: 'Tiếp nhận lịch hẹn trải nghiệm', duration: 6000 },
    );
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
      {/* 1. Breadcrumb & Header info bar */}
      <ProductBreadcrumb product={product} selectedVariant={selectedVariant} />

      {/* 2. Main Hero Section */}
      <section className="w-full py-8 lg:py-16">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Cột trái: Gallery */}
            <ProductGallery
              product={product}
              galleryImages={galleryImages}
              onZoom={(img) => setZoomImage(img)}
            />

            {/* Cột phải: Thông tin, Bộ chọn, Tồn kho, Nút mua, Accordions */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
              <ProductHeader product={product} selectedVariant={selectedVariant} />

              {selectedVariant && (
                <ProductVariantSelector
                  product={product}
                  selectedVariant={selectedVariant}
                  onSelectVariant={(v) => setSelectedVariant(v)}
                />
              )}

              <ProductStockMatrix
                selectedVariant={selectedVariant}
                isAuthenticated={isAuthenticated}
                userRole={user?.role}
              />

              <ProductActions
                product={product}
                selectedVariant={selectedVariant}
                userRole={user?.role}
                onAddToBag={handleAddToBag}
                onOpenViewingModal={() => setViewingModalOpen(true)}
              />

              <ProductAccordions
                product={product}
                selectedVariant={selectedVariant}
                activeAccordion={activeAccordion}
                onToggleAccordion={toggleAccordion}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tectonic Integrity Craftsmanship Section */}
      <TectonicIntegrity />

      {/* 4. Customer Reviews Section */}
      <ProductReviewsSection reviews={product.reviews} />

      {/* 5. Concierge Consultation Banner */}
      <ConciergeBanner onOpenViewingModal={() => setViewingModalOpen(true)} />

      {/* 6. Modals & Notifications */}
      <PrivateViewingModal
        isOpen={viewingModalOpen}
        onClose={() => setViewingModalOpen(false)}
        productName={product.name}
        viewingForm={viewingForm}
        onChangeForm={(f) => setViewingForm(f)}
        onSubmit={handleViewingSubmit}
      />

      <ZoomLightboxModal
        zoomImage={zoomImage}
        onClose={() => setZoomImage(null)}
      />

      <AddToCartToast message={toastMessage} />
    </div>
  );
};

export default P03_ProductDetailPage;
