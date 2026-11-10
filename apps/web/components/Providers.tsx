'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { CartDrawer } from './CartDrawer';
import { Navbar } from './Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <CartDrawer />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}

export default Providers;
