'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { CartItem, ItemSize, ToppingCode } from '../lib/types';

const CART_KEY = 'brewlite_cart';

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

export interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  loadFixtureCart: () => void;
  totalCount: number;
  subTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function areConfigsEqual(
  a: { productId: string; size: ItemSize; toppings: ToppingCode[] },
  b: { productId: string; size: ItemSize; toppings: ToppingCode[] },
): boolean {
  if (a.productId !== b.productId || a.size !== b.size) return false;
  if (a.toppings.length !== b.toppings.length) return false;
  const sortedA = [...a.toppings].sort();
  const sortedB = [...b.toppings].sort();
  return sortedA.every((top, idx) => top === sortedB[idx]);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore parse errors
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

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) =>
        areConfigsEqual(item, newItem),
      );

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + newItem.quantity;
        const unit = parseInt(existing.unitPrice, 10) || 0;
        const updated: CartItem = {
          ...existing,
          quantity: newQty,
          itemTotal: (unit * newQty).toString(),
        };
        const next = [...prev];
        next[existingIndex] = updated;
        return next;
      }

      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      if (quantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const target = prev[index];
      const unit = parseInt(target.unitPrice, 10) || 0;
      const updated: CartItem = {
        ...target,
        quantity,
        itemTotal: (unit * quantity).toString(),
      };
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const loadFixtureCart = useCallback(() => {
    setItems(CART_FIXTURES);
  }, []);

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
        removeItem,
        clearCart,
        loadFixtureCart,
        totalCount,
        subTotal,
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
