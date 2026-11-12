'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type {
  CartItem,
  CreateOrderItemDto,
  CreateOrderRequest,
  ItemSize,
  ToppingCode,
} from '../lib/types';

export const CART_KEY = 'brewlite_cart';
export const CART_NOTE_KEY = 'brewlite_cart_note';

/**
 * Bảng phụ thu Size chuẩn theo docs/architecture/api-contracts.md (Mục 1.3)
 */
export const SIZE_SURCHARGES: Record<ItemSize, number> = {
  REGULAR: 0,
  LARGE: 10000,
};

/**
 * Bảng phụ thu Topping chuẩn theo docs/architecture/api-contracts.md (Mục 1.3)
 */
export const TOPPING_SURCHARGES: Record<ToppingCode, number> = {
  TRAN_CHAU: 5000,
  KEM_CHEESE: 10000,
  THACH_DAO: 7000,
};

export const SIZE_OPTIONS: {
  code: ItemSize;
  label: string;
  shortLabel: string;
  surcharge: number;
}[] = [
  {
    code: 'REGULAR',
    label: 'Size M (Tiêu chuẩn)',
    shortLabel: 'Regular (M)',
    surcharge: 0,
  },
  {
    code: 'LARGE',
    label: 'Size L (Cỡ lớn)',
    shortLabel: 'Large (L)',
    surcharge: 10000,
  },
];

export const TOPPING_OPTIONS: {
  code: ToppingCode;
  label: string;
  surcharge: number;
}[] = [
  { code: 'TRAN_CHAU', label: 'Trân châu đen', surcharge: 5000 },
  { code: 'KEM_CHEESE', label: 'Kem Cheese Macchiato', surcharge: 10000 },
  { code: 'THACH_DAO', label: 'Thạch đào', surcharge: 7000 },
];

const VALID_SIZES = new Set<ItemSize>(['REGULAR', 'LARGE']);
const VALID_TOPPINGS = new Set<ToppingCode>([
  'TRAN_CHAU',
  'KEM_CHEESE',
  'THACH_DAO',
]);

export function isValidSize(size: unknown): size is ItemSize {
  return typeof size === 'string' && VALID_SIZES.has(size as ItemSize);
}

export function isValidTopping(code: unknown): code is ToppingCode {
  return typeof code === 'string' && VALID_TOPPINGS.has(code as ToppingCode);
}

/**
 * Lọc bỏ topping không hợp lệ, khử trùng lặp và sắp xếp thứ tự ổn định
 */
export function sanitizeToppings(toppings: unknown): ToppingCode[] {
  if (!Array.isArray(toppings)) return [];
  const unique = new Set<ToppingCode>();
  for (const t of toppings) {
    if (isValidTopping(t)) {
      unique.add(t);
    }
  }
  return Array.from(unique).sort();
}

/**
 * Công thức đơn giá tạm tính phía Client (đồng bộ công thức Server mục 1.3 api-contracts.md):
 * unitPrice = basePrice + sizeSurcharge + sum(toppingSurcharge)
 */
export function calculateUnitPrice(
  basePrice: string | number,
  size: ItemSize,
  toppings: ToppingCode[] = [],
): number {
  const base =
    typeof basePrice === 'number' ? basePrice : parseInt(String(basePrice), 10);
  const safeBase = Number.isFinite(base) && base >= 0 ? base : 0;
  const sizeFee = isValidSize(size) ? SIZE_SURCHARGES[size] : 0;
  const validToppings = sanitizeToppings(toppings);
  const toppingFee = validToppings.reduce(
    (sum, code) => sum + (TOPPING_SURCHARGES[code] ?? 0),
    0,
  );
  return safeBase + sizeFee + toppingFee;
}

/**
 * Tính thành tiền dòng món: itemTotal = unitPrice * quantity
 */
export function calculateItemTotal(
  unitPrice: string | number,
  quantity: number,
): number {
  const unit =
    typeof unitPrice === 'number' ? unitPrice : parseInt(String(unitPrice), 10);
  const safeUnit = Number.isFinite(unit) && unit >= 0 ? unit : 0;
  const safeQty =
    Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
  return safeUnit * safeQty;
}

/**
 * Kiểm tra và chuẩn hóa dữ liệu CartItem đầu vào, loại bỏ dữ liệu hỏng/không hợp lệ
 */
export function sanitizeCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<CartItem>;

  if (
    typeof candidate.productId !== 'string' ||
    candidate.productId.trim() === ''
  ) {
    return null;
  }
  if (typeof candidate.name !== 'string' || candidate.name.trim() === '') {
    return null;
  }
  if (!isValidSize(candidate.size)) {
    return null;
  }

  const parsedBase = parseInt(String(candidate.basePrice ?? ''), 10);
  if (!Number.isFinite(parsedBase) || parsedBase < 0) {
    return null;
  }

  const rawQty = Number(candidate.quantity);
  if (!Number.isFinite(rawQty) || rawQty <= 0) {
    return null;
  }
  const quantity = Math.floor(rawQty);
  if (quantity <= 0) {
    return null;
  }

  const toppings = sanitizeToppings(candidate.toppings);
  const unitPriceNum = calculateUnitPrice(parsedBase, candidate.size, toppings);
  const itemTotalNum = calculateItemTotal(unitPriceNum, quantity);

  return {
    productId: candidate.productId.trim(),
    name: candidate.name.trim(),
    basePrice: String(parsedBase),
    size: candidate.size,
    toppings,
    quantity,
    unitPrice: String(unitPriceNum),
    itemTotal: String(itemTotalNum),
    ...(candidate.imageUrl ? { imageUrl: candidate.imageUrl } : {}),
  };
}

export const CART_FIXTURES: CartItem[] = [
  {
    productId: 'prod_cf_milk',
    name: 'Cà phê sữa đá',
    basePrice: '35000',
    size: 'LARGE',
    toppings: ['TRAN_CHAU'],
    quantity: 2,
    unitPrice: '50000', // 35000 + 10000 (LARGE) + 5000 (TRAN_CHAU)
    itemTotal: '100000',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38',
  },
  {
    productId: 'prod_tea_peach',
    name: 'Trà đào cam sả',
    basePrice: '45000',
    size: 'REGULAR',
    toppings: ['THACH_DAO'],
    quantity: 1,
    unitPrice: '52000', // 45000 + 7000 (THACH_DAO)
    itemTotal: '52000',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc',
  },
];

export interface CatalogSyncResult {
  updated: boolean;
  priceChangedItems: { name: string; oldPrice: string; newPrice: string }[];
  outOfStockItems: { name: string; reason: string }[];
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  updateItemOptions: (
    index: number,
    size: ItemSize,
    toppings: ToppingCode[],
  ) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  loadFixtureCart: () => void;
  totalCount: number;
  subTotal: number;
  deliveryNote: string;
  setDeliveryNote: (note: string) => void;
  getOrderItemsPayload: () => CreateOrderItemDto[];
  toCreateOrderRequest: (noteOverride?: string) => CreateOrderRequest;
  syncWithCatalog: (
    catalog: {
      id: string;
      code?: string;
      name?: string;
      basePrice: string | number;
      isAvailable?: boolean;
      stockQuantity?: number;
    }[],
  ) => CatalogSyncResult;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function areConfigsEqual(
  a: { productId: string; size: ItemSize; toppings: ToppingCode[] },
  b: { productId: string; size: ItemSize; toppings: ToppingCode[] },
): boolean {
  if (a.productId !== b.productId || a.size !== b.size) return false;
  const sortedA = sanitizeToppings(a.toppings);
  const sortedB = sanitizeToppings(b.toppings);
  if (sortedA.length !== sortedB.length) return false;
  return sortedA.every((top, idx) => top === sortedB[idx]);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryNote, setDeliveryNoteState] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load cart and deliveryNote from LocalStorage on mount with sanitization
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validItems = parsed
            .map((entry) => sanitizeCartItem(entry))
            .filter((entry): entry is CartItem => entry !== null);
          setItems(validItems);
        }
      }
      const savedNote = localStorage.getItem(CART_NOTE_KEY);
      if (typeof savedNote === 'string') {
        setDeliveryNoteState(savedNote);
      }
    } catch {
      // Ignore parse errors and reset to empty state safely
      setItems([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to LocalStorage when items change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota errors
    }
  }, [items, isInitialized]);

  // Save deliveryNote to LocalStorage when it changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      if (deliveryNote) {
        localStorage.setItem(CART_NOTE_KEY, deliveryNote);
      } else {
        localStorage.removeItem(CART_NOTE_KEY);
      }
    } catch {
      // Ignore quota errors
    }
  }, [deliveryNote, isInitialized]);

  const addItem = useCallback((newItem: CartItem) => {
    const sanitized = sanitizeCartItem(newItem);
    if (!sanitized) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) =>
        areConfigsEqual(item, sanitized),
      );

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + sanitized.quantity;
        const unit = calculateUnitPrice(
          existing.basePrice,
          existing.size,
          existing.toppings,
        );
        const updated: CartItem = {
          ...existing,
          toppings: sanitizeToppings(existing.toppings),
          quantity: newQty,
          unitPrice: String(unit),
          itemTotal: String(calculateItemTotal(unit, newQty)),
        };
        const next = [...prev];
        next[existingIndex] = updated;
        return next;
      }

      return [...prev, sanitized];
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (!Number.isFinite(quantity)) return;

    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const normalizedQty = Math.floor(quantity);
      if (normalizedQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const target = prev[index];
      const unit = calculateUnitPrice(
        target.basePrice,
        target.size,
        target.toppings,
      );
      const updated: CartItem = {
        ...target,
        quantity: normalizedQty,
        unitPrice: String(unit),
        itemTotal: String(calculateItemTotal(unit, normalizedQty)),
      };
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []);

  const updateItemOptions = useCallback(
    (index: number, size: ItemSize, toppings: ToppingCode[]) => {
      if (!isValidSize(size)) return;
      const cleanToppings = sanitizeToppings(toppings);

      setItems((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const target = prev[index];
        const newUnitPrice = calculateUnitPrice(
          target.basePrice,
          size,
          cleanToppings,
        );
        const updatedCandidate: CartItem = {
          ...target,
          size,
          toppings: cleanToppings,
          unitPrice: String(newUnitPrice),
          itemTotal: String(calculateItemTotal(newUnitPrice, target.quantity)),
        };

        // Check if another line already has the same configuration -> merge lines
        const duplicateIndex = prev.findIndex(
          (item, i) =>
            i !== index && areConfigsEqual(item, updatedCandidate),
        );

        if (duplicateIndex > -1) {
          const existing = prev[duplicateIndex];
          const mergedQty = existing.quantity + target.quantity;
          const mergedItem: CartItem = {
            ...existing,
            size,
            toppings: cleanToppings,
            quantity: mergedQty,
            unitPrice: String(newUnitPrice),
            itemTotal: String(calculateItemTotal(newUnitPrice, mergedQty)),
          };
          return prev
            .map((item, i) => (i === duplicateIndex ? mergedItem : item))
            .filter((_, i) => i !== index);
        }

        const next = [...prev];
        next[index] = updatedCandidate;
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDeliveryNoteState('');
    try {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(CART_NOTE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const loadFixtureCart = useCallback(() => {
    setItems(CART_FIXTURES);
  }, []);

  const setDeliveryNote = useCallback((note: string) => {
    setDeliveryNoteState(note);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  /**
   * Bàn giao payload chuẩn cho Role F (POST /orders):
   * Chỉ gửi productId, quantity, selectedSize, selectedToppings.
   * Tuyệt đối KHÔNG gửi giá từ client lên server (Server-authoritative pricing).
   */
  const getOrderItemsPayload = useCallback((): CreateOrderItemDto[] => {
    return items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      selectedSize: it.size,
      selectedToppings: sanitizeToppings(it.toppings),
    }));
  }, [items]);

  const toCreateOrderRequest = useCallback(
    (noteOverride?: string): CreateOrderRequest => {
      const finalNote = (noteOverride ?? deliveryNote).trim();
      return {
        ...(finalNote ? { deliveryNote: finalNote } : {}),
        items: getOrderItemsPayload(),
      };
    },
    [deliveryNote, getOrderItemsPayload],
  );

  /**
   * Đồng bộ giỏ hàng với dữ liệu catalog mới nhất từ máy chủ (E-20):
   * - Cập nhật giá gốc (basePrice) và tính lại đơn giá / thành tiền nếu server đổi giá.
   * - Phát hiện và loại bỏ các món hết hàng hoặc tạm ngưng phục vụ khỏi giỏ.
   */
  const syncWithCatalog = useCallback(
    (
      catalog: {
        id: string;
        code?: string;
        name?: string;
        basePrice: string | number;
        isAvailable?: boolean;
        stockQuantity?: number;
      }[],
    ): CatalogSyncResult => {
      const priceChangedItems: {
        name: string;
        oldPrice: string;
        newPrice: string;
      }[] = [];
      const outOfStockItems: { name: string; reason: string }[] = [];

      let hasChanges = false;
      const catalogMap = new Map<string, (typeof catalog)[0]>();
      for (const prod of catalog) {
        if (prod.id) catalogMap.set(prod.id, prod);
        if (prod.code) catalogMap.set(prod.code, prod);
      }

      const nextItems: CartItem[] = [];

      for (const item of items) {
        const matched = catalogMap.get(item.productId);
        if (!matched) {
          outOfStockItems.push({
            name: item.name,
            reason: 'Sản phẩm không còn kinh doanh',
          });
          hasChanges = true;
          continue;
        }

        if (
          matched.isAvailable === false ||
          (matched.stockQuantity !== undefined && matched.stockQuantity <= 0)
        ) {
          outOfStockItems.push({
            name: item.name,
            reason: 'Sản phẩm hiện đã hết hàng',
          });
          hasChanges = true;
          continue;
        }

        const currentBase = parseInt(String(item.basePrice), 10);
        const serverBase = parseInt(String(matched.basePrice), 10);

        if (
          Number.isFinite(serverBase) &&
          serverBase >= 0 &&
          serverBase !== currentBase
        ) {
          priceChangedItems.push({
            name: item.name,
            oldPrice: String(currentBase),
            newPrice: String(serverBase),
          });
          hasChanges = true;

          const newUnit = calculateUnitPrice(
            serverBase,
            item.size,
            item.toppings,
          );
          const newTotal = calculateItemTotal(newUnit, item.quantity);
          nextItems.push({
            ...item,
            basePrice: String(serverBase),
            unitPrice: String(newUnit),
            itemTotal: String(newTotal),
          });
        } else {
          nextItems.push(item);
        }
      }

      if (hasChanges) {
        setItems(nextItems);
      }

      return {
        updated: hasChanges,
        priceChangedItems,
        outOfStockItems,
      };
    },
    [items],
  );

  const totalCount = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const subTotal = items.reduce(
    (acc, it) => acc + (parseInt(it.itemTotal, 10) || 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updateItemOptions,
        removeItem,
        clearCart,
        loadFixtureCart,
        totalCount,
        subTotal,
        deliveryNote,
        setDeliveryNote,
        getOrderItemsPayload,
        toCreateOrderRequest,
        syncWithCatalog,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
