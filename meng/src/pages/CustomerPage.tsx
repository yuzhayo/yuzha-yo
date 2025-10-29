/**
 * CustomerPage - Main Customer View
 * 
 * AI AGENT NOTES:
 * - Main page for customer-facing interface
 * - Combines Hero, MenuGrid, Cart, and OrderForm
 * - Manages view state (menu, cart, checkout, confirmation)
 * - Handles all customer interactions
 * 
 * View States:
 * - 'menu': Default view with hero and menu grid
 * - 'checkout': Order form view
 * - 'confirmation': Order success view
 * 
 * Features:
 * - Menu browsing and filtering
 * - Add to cart functionality
 * - Cart management (update, remove items)
 * - Order placement
 * - Order confirmation with number
 * 
 * Context Usage:
 * - useCart: Shopping cart state and actions
 * - menuData: Menu items from local data
 * 
 * When modifying:
 * - Keep view transitions smooth
 * - Test cart persistence (localStorage via context)
 * - Ensure order flow is intuitive
 */

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { getMenuItems, addOrder } from '@/data/menuData';
import type { MenuItem, CustomerInfo } from '@/types';
import { Hero } from '@/components/customer/Hero';
import { MenuGrid } from '@/components/customer/MenuGrid';
import { Cart } from '@/components/customer/Cart';
import { OrderForm } from '@/components/customer/OrderForm';

type View = 'menu' | 'checkout' | 'confirmation';

export const CustomerPage: React.FC = () => {
  const [view, setView] = useState<View>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalPrice,
  } = useCart();

  // Load menu items on mount
  useEffect(() => {
    const items = getMenuItems();
    setMenuItems(items);
  }, []);

  // Handle add to cart
  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
    // Show brief notification (could add toast here)
  };

  // Handle view menu click - scroll to menu section
  const handleViewMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle checkout
  const handleCheckout = () => {
    setIsCartOpen(false);
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle order submission
  const handleSubmitOrder = (customerInfo: CustomerInfo) => {
    const order = addOrder({
      customer: customerInfo,
      items: cartItems,
      total: totalPrice,
      status: 'pending',
    });

    setOrderNumber(order.orderNumber);
    clearCart();
    setView('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle back to menu
  const handleBackToMenu = () => {
    setView('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render based on view
  if (view === 'confirmation') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center animate-fade-in">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-brown mb-2">
            Pesanan Berhasil Dibuat!
          </h2>
          <p className="text-brown text-opacity-70 mb-6">
            Terima kasih telah memesan di Warung Meng
          </p>

          <div className="bg-cream rounded-lg p-4 mb-6">
            <p className="text-sm text-brown text-opacity-70 mb-1">
              Nomor Pesanan Anda
            </p>
            <p className="text-3xl font-bold text-orange">{orderNumber}</p>
          </div>

          <div className="text-left bg-gold bg-opacity-20 rounded-lg p-4 mb-6">
            <p className="text-sm text-brown">
              <strong>Pesanan Anda sedang diproses.</strong>
              <br />
              <br />
              Kami akan menghubungi Anda secepatnya untuk konfirmasi. Pembayaran dapat
              dilakukan saat pesanan tiba atau di kasir.
              <br />
              <br />
              Simpan nomor pesanan Anda untuk referensi.
            </p>
          </div>

          <button
            onClick={handleBackToMenu}
            className="w-full bg-orange text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  if (view === 'checkout') {
    return (
      <div className="min-h-screen bg-cream py-8 px-4">
        <OrderForm
          items={cartItems}
          totalPrice={totalPrice}
          onSubmit={handleSubmitOrder}
          onCancel={handleBackToMenu}
        />
      </div>
    );
  }

  // Default menu view
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <Hero onViewMenu={handleViewMenu} />

      {/* Menu Section */}
      <section ref={menuRef} className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-brown mb-8">Menu Kami</h2>
        <MenuGrid items={menuItems} onAddToCart={handleAddToCart} />
      </section>

      {/* Cart Modal */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
        totalPrice={totalPrice}
      />

      {/* Floating Cart Button (Mobile) */}
      {cartItems.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 bg-orange text-white rounded-full p-4 shadow-2xl hover:bg-opacity-90 transition-all hover:scale-110 z-30"
          aria-label="Open cart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="absolute -top-2 -right-2 bg-gold text-brown text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </button>
      )}
    </div>
  );
};
