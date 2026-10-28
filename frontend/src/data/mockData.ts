// ============================================================================
// File: frontend/src/data/mockData.ts
// Vai trò: Nguồn dữ liệu tĩnh (mockData) cho trang chủ và các thành phần giao diện
//          AUREN Architectural Design:
//          - Bộ sưu tập sản phẩm kinh điển
//          - Bảng vật liệu kiến trúc
//          - Bài viết Studio Archive / Journal
//          - Thông tin phòng trưng bày (Showrooms)
// ============================================================================

import type { ProductSummary } from '../types';

export interface MaterialItem {
  id: string;
  num: string;
  name: string;
  description: string;
}

export interface JournalArticle {
  id: string;
  category: string;
  readTime: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  ratio: '4-3' | '3-4';
  isLead?: boolean;
}

export interface NavItem {
  label: string;
  path: string;
  anchor?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Bộ sưu tập', path: '/products', anchor: false },
  { label: 'Chất liệu', path: '/#materials', anchor: true },
  { label: 'Triết lý', path: '/#craft', anchor: true },
  { label: 'Tạp chí', path: '/#journal', anchor: true },
  { label: 'Showroom', path: '/#showroom', anchor: true },
] as const;

export const FEATURED_COLLECTION: readonly ProductSummary[] = [
  {
    id: 1,
    name: 'Auren Lounge Chair',
    collectionName: 'Auren Architectural',
    designerName: 'AUREN Studio',
    isLimited: true,
    isMadeToOrder: false,
    brand: { id: 1, name: 'AUREN' },
    category: { id: 1, name: 'Ghế bành' },
    minPrice: 92400000, // $3,850 ~ 92.400.000 ₫
    avgRating: 5.0,
    reviewCount: 14,
    imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1400&q=85&auto=format&fit=crop',
    materialNote: 'Gỗ óc chó Mỹ nguyên khối · Da bò thuộc thảo mộc tự nhiên',
    aspectRatio: '4-5',
    colSpan: 7,
  },
  {
    id: 2,
    name: 'Noma Sofa',
    collectionName: 'Nordic Quiet',
    designerName: 'Lukas Eklund',
    isLimited: false,
    isMadeToOrder: true,
    brand: { id: 1, name: 'AUREN' },
    category: { id: 2, name: 'Sofa' },
    minPrice: 182400000, // $7,600 ~ 182.400.000 ₫
    avgRating: 4.9,
    reviewCount: 9,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1100&q=85&auto=format&fit=crop',
    materialNote: 'Vải lanh Bỉ dệt mộc · Khung gỗ sồi xông khói',
    aspectRatio: '3-4',
    colSpan: 5,
  },
  {
    id: 3,
    name: 'Sora Side Table',
    collectionName: 'Mineral Monolith',
    designerName: 'Elena Vieri',
    isLimited: false,
    isMadeToOrder: false,
    brand: { id: 1, name: 'AUREN' },
    category: { id: 3, name: 'Bàn phụ' },
    minPrice: 39600000, // $1,650 ~ 39.600.000 ₫
    avgRating: 4.8,
    reviewCount: 6,
    imageUrl: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&q=85&auto=format&fit=crop',
    materialNote: 'Đá Travertine nguyên khối mài mờ khai thác tại Ý',
    aspectRatio: '1-1',
    colSpan: 4,
  },
  {
    id: 4,
    name: 'Kiso Lounge Chair',
    collectionName: 'Kyoto Archive',
    designerName: 'Kenzo Takahashi',
    isLimited: false,
    isMadeToOrder: false,
    brand: { id: 1, name: 'AUREN' },
    category: { id: 1, name: 'Ghế bành' },
    minPrice: 76800000, // $3,200 ~ 76.800.000 ₫
    avgRating: 5.0,
    reviewCount: 11,
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=85&auto=format&fit=crop',
    materialNote: 'Gỗ sồi trắng xẻ xuyên tâm · Đệm len lông cừu dệt tay',
    aspectRatio: '4-5',
    colSpan: 4,
  },
  {
    id: 5,
    name: 'Atelier Dining Table',
    collectionName: 'Atelier Series',
    designerName: 'AUREN Studio',
    isLimited: false,
    isMadeToOrder: true,
    brand: { id: 1, name: 'AUREN' },
    category: { id: 4, name: 'Bàn ăn' },
    minPrice: 129600000, // $5,400 ~ 129.600.000 ₫
    avgRating: 4.9,
    reviewCount: 8,
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=900&q=85&auto=format&fit=crop',
    materialNote: 'Gỗ óc chó mặt phẳng dày · Phụ kiện đồng thau ô-xy hóa mờ',
    aspectRatio: '16-10',
    colSpan: 4,
  },
  {
    id: 6,
    name: 'Forma Platform Bed',
    collectionName: 'Sanctuary Suite',
    designerName: 'Astrid Lind',
    isLimited: true,
    isMadeToOrder: true,
    brand: { id: 1, name: 'AUREN' },
    category: { id: 5, name: 'Giường ngủ' },
    minPrice: 148800000, // $6,200 ~ 148.800.000 ₫
    avgRating: 5.0,
    reviewCount: 7,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1400&q=85&auto=format&fit=crop',
    materialNote: 'Khung bục gỗ óc chó tự nhiên · Tựa đầu vải lanh đan thủ công',
    aspectRatio: '16-9',
    colSpan: 7,
  },
  {
    id: 7,
    name: 'Noma Modular Sectional',
    collectionName: 'Nordic Quiet',
    designerName: 'Lukas Eklund',
    isLimited: false,
    isMadeToOrder: true,
    brand: { id: 1, name: 'AUREN' },
    category: { id: 2, name: 'Sofa' },
    minPrice: 213600000, // $8,900 ~ 213.600.000 ₫
    avgRating: 4.9,
    reviewCount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1100&q=85&auto=format&fit=crop',
    materialNote: 'Len bouclé sợi dày · Mối ghép mộng ngầm cơ khí chuẩn xác',
    aspectRatio: '4-3',
    colSpan: 5,
  },
] as const;

export const MATERIALS_CATALOG: readonly MaterialItem[] = [
  {
    id: 'walnut',
    num: '01',
    name: 'Gỗ óc chó Mỹ (American Walnut)',
    description:
      'Gỗ giác lõi tối màu khai thác từ rừng bền vững, thớ vân uyển chuyển chuyển sắc hổ phách trầm ấm và bóng mịn qua nhiều thập kỷ sử dụng.',
  },
  {
    id: 'oak',
    num: '02',
    name: 'Gỗ sồi trắng (White Oak)',
    description:
      'Xẻ xuyên tâm theo tiêu chuẩn kiến trúc nhằm hạn chế biến dạng, phô diễn các tia tủy gỗ li ti và bề mặt xúc giác vân mở tự nhiên.',
  },
  {
    id: 'travertine',
    num: '03',
    name: 'Đá Travertine mài mờ (Honed Travertine)',
    description:
      'Trầm tích vôi tự nhiên từ mỏ đá Tuscan miền Trung nước Ý, giữ nguyên kết cấu vi xốp hữu cơ để thở cùng thời gian.',
  },
  {
    id: 'linen',
    num: '04',
    name: 'Vải lanh Bỉ (Belgian Linen)',
    description:
      'Sợi lanh dài không qua tẩy trắng công nghiệp, thoáng khí và dẻo dai, càng giặt và tiếp xúc càng mềm mại tuyệt mỹ.',
  },
  {
    id: 'leather',
    num: '05',
    name: 'Da thuộc thảo mộc (Vegetable Leather)',
    description:
      'Thuộc chậm rãi bằng tannin vỏ sồi tự nhiên không hóa chất kim loại nặng, ghi dấu lớp ánh đồng (patina) riêng biệt của chủ nhân.',
  },
] as const;

export const JOURNAL_ARTICLES: readonly JournalArticle[] = [
  {
    id: 'quiet-spaces',
    category: 'Không gian sống · 6 phút đọc',
    readTime: '6 phút',
    title: 'Kiến trúc của những không gian tĩnh lặng',
    excerpt:
      'Cách kỷ luật tiết chế, ánh sáng tự nhiên và chất liệu trung thực đồng hành tạo nên gian phòng khơi gợi chiều sâu chiêm nghiệm.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1100&q=85&auto=format&fit=crop',
    ratio: '4-3',
    isLead: true,
  },
  {
    id: 'natural-materials',
    category: 'Vật liệu học · 4 phút đọc',
    readTime: '4 phút',
    title: 'Vì sao vật liệu tự nhiên càng cũ càng đẹp',
    excerpt:
      'Cơ chế sinh học và triết lý thẩm mỹ đằng sau gỗ, đá và da thuộc: vật liệu tích lũy thời gian thay vì hao mòn hư hại.',
    imageUrl: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800&q=85&auto=format&fit=crop',
    ratio: '3-4',
  },
  {
    id: 'singular-anchor',
    category: 'Thực hành · 5 phút đọc',
    readTime: '5 phút',
    title: 'Thiết kế phòng khách xoay quanh một tác phẩm đơn độc',
    excerpt:
      'KTS Marta Nilsson bàn về việc xác lập một điểm tựa kiến trúc duy nhất để định hình hướng sáng, luồng di chuyển và nhịp điệu bình yên.',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85&auto=format&fit=crop',
    ratio: '3-4',
  },
] as const;
