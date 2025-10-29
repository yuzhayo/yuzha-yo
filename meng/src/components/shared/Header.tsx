/**
 * Shared Header Component
 * 
 * AI AGENT NOTES:
 * - Main navigation header for the app
 * - Shows logo, app name, and navigation items
 * - Displays cart item count badge
 * - Switches between customer and admin views
 * - Mobile-responsive with hamburger menu capability
 * 
 * Props:
 * - view: 'customer' | 'admin' - Current view mode
 * - onViewChange: (view: 'customer' | 'admin') => void - Switch view
 * - cartItemCount: number - Number of items in cart (for badge)
 * - onCartClick: () => void - Handler for cart button click
 * 
 * Features:
 * - Sticky header on scroll
 * - Logo with brand name
 * - View switcher buttons
 * - Cart icon with badge (customer view only)
 * - Admin logout button (admin view only)
 * 
 * When modifying:
 * - Keep mobile responsive design
 * - Maintain z-index for proper stacking
 * - Test view switching logic
 */

import React from 'react';
import { Button } from './Button';

interface HeaderProps {
  view: 'customer' | 'admin';
  onViewChange: (view: 'customer' | 'admin') => void;
  cartItemCount?: number;
  onCartClick?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  view,
  onViewChange,
  cartItemCount = 0,
  onCartClick,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-cream border-b-2 border-brown border-opacity-10 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Warung Meng Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-brown">Warung Meng</h1>
              <p className="text-xs text-brown text-opacity-60">
                {view === 'customer' ? 'Restoran & Kuliner' : 'Admin Dashboard'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {view === 'customer' ? (
              <>
                {/* Cart Button */}
                <button
                  onClick={onCartClick}
                  className="relative p-2 text-brown hover:text-orange transition-colors"
                  aria-label="Shopping Cart"
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
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </button>

                {/* Switch to Admin */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewChange('admin')}
                >
                  Admin
                </Button>
              </>
            ) : (
              <>
                {/* Switch to Customer */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewChange('customer')}
                >
                  Lihat Menu
                </Button>

                {/* Logout Button */}
                <Button variant="outline" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
