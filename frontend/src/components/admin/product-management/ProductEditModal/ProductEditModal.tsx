import React from 'react';
import { X } from 'lucide-react';
import type { CatalogMeta, CreateProductInput, ProductSummary } from '../../../../types';

export interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductSummary | null;
  formData: CreateProductInput;
  onFormDataChange: (data: CreateProductInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  meta: CatalogMeta | null;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  formData,
  onFormDataChange,
  onSubmit,
  submitting,
  meta,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#FAF8F3] border border-[#D2C8BA] w-full max-w-lg rounded-[2px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#D2C8BA] flex items-center justify-between bg-white">
          <h3 className="font-serif text-lg font-medium text-[#0D0703]">
            {editingProduct
              ? `Chỉnh sửa Sản phẩm #${editingProduct.id}`
              : 'Thêm Sản phẩm Kiến trúc Mới'}
          </h3>
          <button onClick={onClose} className="text-[#7B6E64] hover:text-[#0D0703]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0D0703] mb-1">
              Tên Sản phẩm <span className="text-[#BA1A1A]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
              placeholder="Ví dụ: Auren Arch Lounge Chair"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#0D0703] mb-1">
                Thương hiệu <span className="text-[#BA1A1A]">*</span>
              </label>
              <select
                value={formData.brandId}
                onChange={(e) =>
                  onFormDataChange({ ...formData, brandId: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
              >
                {meta?.brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.country || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0D0703] mb-1">
                Danh mục <span className="text-[#BA1A1A]">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  onFormDataChange({ ...formData, categoryId: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
              >
                {meta?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#0D0703] mb-1">
                Bộ sưu tập (Collection)
              </label>
              <input
                type="text"
                value={formData.collectionName || ''}
                onChange={(e) =>
                  onFormDataChange({ ...formData, collectionName: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                placeholder="Nordic Calm..."
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0D0703] mb-1">
                Nhà thiết kế (Designer)
              </label>
              <input
                type="text"
                value={formData.designerName || ''}
                onChange={(e) =>
                  onFormDataChange({ ...formData, designerName: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
                placeholder="Alvar Aalto..."
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0D0703] mb-1">
              Mô tả kiến trúc / chế tác
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D2C8BA] rounded-[2px] focus:outline-none focus:border-[#0D0703]"
              placeholder="Mô tả phong cách, cảm hứng thiết kế..."
            />
          </div>

          <div className="p-3 bg-white border border-[#D2C8BA] rounded-[2px] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLimited"
                checked={formData.isLimited}
                onChange={(e) => onFormDataChange({ ...formData, isLimited: e.target.checked })}
                className="rounded-[2px]"
              />
              <label htmlFor="isLimited" className="font-semibold text-[#0D0703] cursor-pointer">
                Sản phẩm Phiên bản Giới hạn (Limited Edition — Đánh số serial độc bản)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isMadeToOrder"
                checked={formData.isMadeToOrder}
                onChange={(e) =>
                  onFormDataChange({ ...formData, isMadeToOrder: e.target.checked })
                }
                className="rounded-[2px]"
              />
              <label
                htmlFor="isMadeToOrder"
                className="font-semibold text-[#0D0703] cursor-pointer"
              >
                Chế tác theo yêu cầu riêng (Made-to-Order / Bespoke)
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D2C8BA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D2C8BA] font-semibold text-[#503625] hover:bg-white rounded-[2px]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0D0703] text-white font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#271E18]"
            >
              {submitting ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
