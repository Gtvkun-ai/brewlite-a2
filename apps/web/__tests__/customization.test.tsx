import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductOptionSelector from '../components/ProductOptionSelector';
import CartDrawer from '../components/CartDrawer';
import QuickOrderModal from '../components/QuickOrderModal';
import { CART_KEY, CartProvider, sanitizeCartItem, useCart } from '../context/CartContext';
import type { Product } from '../lib/types';

const product: Product = {
  id: 'coffee-salt', code: 'COFFEE-SALT', name: 'Cà phê muối',
  description: 'Cà phê kem muối', basePrice: '45000', imageUrl: '/coffee.jpg',
  category: 'Coffee', isAvailable: true, stockQuantity: 20,
};

function CartProbe() {
  const cart = useCart();
  return <>
    <pre data-testid="items">{JSON.stringify(cart.items)}</pre>
    <pre data-testid="payload">{JSON.stringify(cart.toCreateOrderRequest())}</pre>
  </>;
}

describe('Per-item preparation preferences', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { cleanup(); localStorage.clear(); });

  it('keeps 70% sugar / 50% ice through adding, persistence and server payload without mixing into the order note', () => {
    render(<CartProvider><ProductOptionSelector product={product} /><CartProbe /></CartProvider>);
    fireEvent.click(screen.getByTestId('size-LARGE'));
    fireEvent.click(screen.getByTestId('topping-TRAN_CHAU'));
    fireEvent.click(screen.getByTestId('sugar-70'));
    fireEvent.click(screen.getByTestId('ice-LESS'));
    fireEvent.change(screen.getByTestId('product-note'), { target: { value: 'Bàn số 4' } });
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));

    const payload = JSON.parse(screen.getByTestId('payload').textContent!);
    expect(payload).toEqual({
      deliveryNote: 'Bàn số 4',
      items: [{ productId: 'coffee-salt', quantity: 1, selectedSize: 'LARGE',
        selectedToppings: ['TRAN_CHAU'], selectedSugar: 70, selectedIce: 'LESS' }],
    });
    const stored = JSON.parse(localStorage.getItem(CART_KEY)!);
    expect(stored[0]).toMatchObject({ sugar: 70, ice: 'LESS', unitPrice: '60000', itemTotal: '60000' });

    cleanup();
    render(<CartProvider><CartProbe /><CartDrawer isOpen /></CartProvider>);
    expect(screen.getByTestId('drawer-preparation-0')).toHaveTextContent('Đường 70%');
    expect(screen.getByTestId('drawer-preparation-0')).toHaveTextContent('Đá 50%');
    expect(JSON.parse(screen.getByTestId('payload').textContent!)).toEqual(payload);
  });

  it('separates different sugar or ice configurations and merges matching configurations', () => {
    render(<CartProvider><ProductOptionSelector product={product} /><CartProbe /></CartProvider>);
    fireEvent.click(screen.getByTestId('sugar-70'));
    fireEvent.click(screen.getByTestId('ice-LESS'));
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    fireEvent.click(screen.getByTestId('sugar-50'));
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    fireEvent.click(screen.getByTestId('ice-NONE'));
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    const items = JSON.parse(screen.getByTestId('items').textContent!);
    expect(items).toHaveLength(3);
    expect(items.map((item: { quantity: number }) => item.quantity)).toEqual([1, 1, 2]);
  });

  it('normalizes legacy and corrupted preparation values to recipe defaults', () => {
    const legacy = { productId: product.id, name: product.name, basePrice: product.basePrice,
      size: 'REGULAR', toppings: [], quantity: 1 };
    expect(sanitizeCartItem(legacy)).toMatchObject({ sugar: 100, ice: 'NORMAL' });
    expect(sanitizeCartItem({ ...legacy, sugar: 999, ice: 'invalid' })).toMatchObject({ sugar: 100, ice: 'NORMAL' });
  });

  it('opens the drawer immediately after the quick-order modal and supports Escape to close it', () => {
    function Flow() {
      const [selected, setSelected] = React.useState<Product | null>(product);
      return <>
        {selected && <QuickOrderModal product={selected} onClose={() => setSelected(null)} />}
        <CartDrawer />
      </>;
    }
    render(<CartProvider><Flow /></CartProvider>);
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    expect(screen.queryByTestId('quick-order-modal')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Giỏ hàng' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('cart-drawer')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('locks an unavailable product against adding and preference changes', () => {
    const onAdded = vi.fn();
    render(<CartProvider><ProductOptionSelector product={{ ...product, isAvailable: false }} onAdded={onAdded} /></CartProvider>);
    expect(screen.getByTestId('add-to-cart-btn')).toBeDisabled();
    expect(screen.getByTestId('sugar-70')).toBeDisabled();
    expect(screen.getByTestId('ice-LESS')).toBeDisabled();
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('keeps keyboard focus inside the drawer after removing its focused item', () => {
    render(<CartProvider><ProductOptionSelector product={product} /><CartDrawer isOpen /></CartProvider>);
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    const remove = screen.getByTestId('drawer-remove-0');
    remove.focus();
    fireEvent.click(remove);
    expect(document.activeElement).toBe(document.body);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByTestId('cart-drawer-close')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('link', { name: 'Khám phá Menu' })).toHaveFocus();
  });
});
