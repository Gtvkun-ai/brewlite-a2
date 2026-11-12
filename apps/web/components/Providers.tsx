'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { CartDrawer } from './CartDrawer';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-shell">
          <Navbar />
          <CartDrawer />
          <div className="app-content">{children}</div>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default Providers;
