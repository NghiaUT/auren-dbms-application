import React from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Calendar } from 'lucide-react';
import type { OrderDetail } from '../../../../types';
import { formatVND } from '../../../../utils/formatVND';
import { formatDate } from '../../../../utils/formatDate';

export interface OrderCustomerSpatialCardProps {
  order: OrderDetail;
}

export const OrderCustomerSpatialCard: React.FC<OrderCustomerSpatialCardProps> = ({ order }) => {
  return (
    <div className="space-y-6">
      {/* Khối Khách hàng & Giao nhận */}
      <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6">
        <h3 className="font-serif text-lg text-[#0D0703] mb-4 pb-2 border-b border-[#D2C8BA]/40 flex items-center gap-2">
          <User className="w-4 h-4 text-[#A7824B]" />
          <span>Hồ Sơ Khách Hàng</span>
        </h3>

        <div className="space-y-3 font-sans text-xs">
          <div>
            <span className="text-[10px] text-[#7B6E64] uppercase font-mono block">Họ và tên</span>
            <span className="font-semibold text-sm text-[#0D0703]">{order.customerName}</span>
          </div>

          <div>
            <span className="text-[10px] text-[#7B6E64] uppercase font-mono block">Thư tín điện tử</span>
            <span className="text-[#0D0703]">{order.customerEmail}</span>
          </div>

          <div>
            <span className="text-[10px] text-[#7B6E64] uppercase font-mono block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#A7824B]" /> Địa chỉ giao nhận White-Glove
            </span>
            <span className="text-[#0D0703] font-medium leading-relaxed block mt-0.5">
              {order.shippingAddress}
            </span>
          </div>

          {order.deliveryDate && (
            <div className="pt-2 border-t border-[#D2C8BA]/30">
              <span className="text-[10px] text-[#7B6E64] uppercase font-mono block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#246A38]" /> Hạn bàn giao dự kiến
              </span>
              <span className="font-serif font-medium text-sm text-[#246A38] block mt-0.5">
                {formatDate(order.deliveryDate)}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Khối Quyết toán Tài chính */}
      <section className="bg-[#FAF8F3] border border-[#D2C8BA] rounded-[2px] p-6">
        <h3 className="font-serif text-lg text-[#0D0703] mb-4 pb-2 border-b border-[#D2C8BA]/40">
          Giá Trị Hợp Đồng
        </h3>

        <div className="space-y-2 text-xs font-sans">
          <div className="flex justify-between text-[#7B6E64]">
            <span>Tạm tính giá gốc</span>
            <span className="font-mono">{formatVND(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-[#A7824B]">
              <span>Chiết khấu thành viên</span>
              <span className="font-mono">- {formatVND(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#7B6E64]">
            <span>Vận chuyển White-Glove</span>
            <span className="font-mono uppercase text-[10px] text-[#246A38] font-bold">Miễn phí</span>
          </div>

          <div className="pt-3 border-t border-[#D2C8BA] flex justify-between items-baseline">
            <span className="font-serif text-sm font-semibold text-[#0D0703]">Tổng quyết toán</span>
            <span className="font-serif text-xl font-medium text-[#0D0703]">
              {formatVND(order.total)}
            </span>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-[#D2C8BA]/40">
          <Link
            to={`/sales/orders/${order.id}/payments`}
            className="w-full py-2.5 px-3 bg-white border border-[#D2C8BA] hover:border-[#271E18] text-[#0D0703] font-sans text-xs font-semibold uppercase tracking-wider rounded-[2px] block text-center transition-colors"
          >
            Xem Tiến Độ Thanh Toán →
          </Link>
        </div>
      </section>
    </div>
  );
};
