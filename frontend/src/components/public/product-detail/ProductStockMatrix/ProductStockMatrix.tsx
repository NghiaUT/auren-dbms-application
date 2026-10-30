import React from 'react';
import { Link } from 'react-router-dom';
import type { Variant } from '../../../../types';

export interface ProductStockMatrixProps {
  selectedVariant: Variant | null;
  isAuthenticated: boolean;
  userRole?: string;
}

export const ProductStockMatrix: React.FC<ProductStockMatrixProps> = ({
  selectedVariant,
  isAuthenticated,
  userRole,
}) => {
  return (
    <div className="bg-[#FAF8F3] border border-[#D2C8BA]/60 p-5 rounded-[2px] space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0703]">
          Hiện diện tại Showroom &amp; Kho lưu trữ
        </h4>
        {isAuthenticated ? (
          <span className="font-sans text-[10px] text-[#A7824B] uppercase tracking-wider">
            Phiên xác thực ({userRole})
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
  );
};
