// ============================================================================
// File: frontend/src/utils/cartStorage.ts
// Vai trò: Tiện ích lưu trữ giỏ hàng phía Client (localStorage):
//          - Quản lý danh sách tác phẩm được thêm vào túi hàng
//          - Phát sự kiện 'cart_updated' để đồng bộ số lượng tức thì trên Header
//          - Hỗ trợ cập nhật số lượng, xóa sản phẩm, đính kèm khắc biển đồng (customization)
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
  locationId?: number;
  customization?: Record<string, any>;
}

const STORAGE_KEY = 'auren_cart';

function saveItems(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart_updated'));
  } catch (err) {
    console.error('Không thể lưu giỏ hàng vào localStorage:', err);
  }
}

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
    if (item.customization) {
      items[existingIdx].customization = {
        ...items[existingIdx].customization,
        ...item.customization,
      };
    }
  } else {
    items.push({ ...item, quantity });
  }

  saveItems(items);
  return items;
}

export function updateQuantity(variantId: number, quantity: number): CartItem[] {
  let items = getCartItems();
  if (quantity <= 0) {
    items = items.filter((i) => i.variantId !== variantId);
  } else {
    const item = items.find((i) => i.variantId === variantId);
    if (item) item.quantity = quantity;
  }
  saveItems(items);
  return items;
}

export function updateCustomization(
  variantId: number,
  customization: Record<string, any>,
): CartItem[] {
  const items = getCartItems();
  const item = items.find((i) => i.variantId === variantId);
  if (item) {
    item.customization = customization;
    saveItems(items);
  }
  return items;
}

export function removeFromCart(variantId: number): CartItem[] {
  const items = getCartItems().filter((i) => i.variantId !== variantId);
  saveItems(items);
  return items;
}

export function clearCart(): void {
  saveItems([]);
}
