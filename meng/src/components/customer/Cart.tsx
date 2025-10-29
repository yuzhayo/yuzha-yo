/**
 * Cart Component - Shopping Cart Modal/Sidebar
 * 
 * AI AGENT NOTES:
 * - Shopping cart display with item management
 * - Shows all items in cart with quantities
 * - Allows quantity updates and item removal
 * - Displays total price
 * - Checkout button to proceed to order form
 * 
 * Props:
 * - isOpen: boolean - Is cart visible?
 * - onClose: () => void - Handler to close cart
 * - items: CartItem[] - Items in cart
 * - onUpdateQuantity: (id: string, quantity: number) => void
 * - onRemoveItem: (id: string) => void
 * - onCheckout: () => void - Proceed to checkout
 * - totalPrice: number - Total cart price
 * 
 * Features:
 * - Slide-in modal from right
 * - Item list with images and details
 * - Quantity controls (+ / -)
 * - Remove item button
 * - Total price calculation
 * - Empty cart state
 * - Mobile-responsive
 * 
 * When modifying:
 * - Keep modal accessible (close on overlay click, ESC key)
 * - Test quantity updates don't break calculations
 * - Ensure mobile usability (large touch targets)
 */

import React, { useEffect } from 'react';
import type { CartItem } from '@/types';
import { formatPrice } from '@/data/menuData';
import { Button } from '../shared/Button';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  totalPrice: number;
}

export const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  totalPrice,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-brown border-opacity-10">
          <h2 className="text-xl font-bold text-brown">Keranjang Belanja</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cream rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-brown"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-bold text-brown mb-2">Keranjang Kosong</h3>
              <p className="text-brown text-opacity-70 mb-4">
                Belum ada item di keranjang Anda
              </p>
              <Button variant="primary" onClick={onClose}>
                Mulai Belanja
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-cream p-3 rounded-lg"
                >
                  {/* Image */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />

                  {/* Details */}
                  <div className="flex-1">
                    <h4 className="font-bold text-brown text-sm mb-1">
                      {item.name}
                    </h4>
                    <p className="text-orange font-bold text-sm mb-2">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border-2 border-orange text-orange hover:bg-orange hover:text-white transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-brown">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange text-white hover:bg-opacity-90 transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove item"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Subtotal */}
                    <p className="text-xs text-brown text-opacity-70 mt-1">
                      Subtotal: {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total and Checkout */}
        {items.length > 0 && (
          <div className="border-t-2 border-brown border-opacity-10 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-brown">Total:</span>
              <span className="text-2xl font-bold text-orange">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={onCheckout}>
              Lanjut Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
