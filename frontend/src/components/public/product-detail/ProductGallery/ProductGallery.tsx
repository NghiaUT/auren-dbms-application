import React from 'react';
import type { ProductDetail } from '../../../../types';

export interface ProductGalleryProps {
  product: ProductDetail;
  galleryImages: {
    hero: string;
    macro1: string;
    macro2: string;
    insitu: string;
  };
  onZoom: (img: string) => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  product,
  galleryImages,
  onZoom,
}) => {
  return (
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
          onClick={() => onZoom(galleryImages.hero)}
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
  );
};
