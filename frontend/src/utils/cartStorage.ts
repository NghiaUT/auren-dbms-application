// ============================================================================
// File: frontend/src/utils/cartStorage.ts
// Vai trò: Tiện ích lưu trữ giỏ hàng phía Client (localStorage):
//          - Quản lý danh sách tác phẩm được thêm vào túi hàng
//          - Phát sự kiện 'cart_updated' để đồng bộ số lượng tức thì trên Header
// ============================================================================

export interface CartItem {
  productId: number;
  variantId: number;
  productName: string;
  variantFinish: string;
  variantSize: string;
  sku: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  designerName?: string | null;
  collectionName?: string | null;
}

const STORAGE_KEY = 'auren_cart';

export function getCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getCartCount(): number {
  const items = getCartItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1): CartItem[] {
  const items = getCartItems();
  const existingIdx = items.findIndex((i) => i.variantId === item.variantId);

  if (existingIdx >= 0) {
    items[existingIdx].quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart_updated'));
  } catch (err) {
    console.error('Không thể lưu giỏ hàng vào localStorage:', err);
  }

  return items;
}
