/**
 * Main Application Component
 * 
 * AI AGENT NOTES:
 * - Root component for the Warung Meng application
 * - Handles view switching between customer and admin
 * - Provides context providers (Cart, Auth)
 * - Manages header and footer layout
 * 
 * View States:
 * - 'customer': Customer-facing menu and ordering
 * - 'admin': Admin dashboard and management
 * 
 * Context Providers:
 * - CartProvider: Shopping cart state
 * - AuthProvider: Admin authentication
 * 
 * Layout Structure:
 * - Header (with view switcher and cart)
 * - Main content (CustomerPage or AdminPage)
 * - Footer (customer view only)
 * 
 * When modifying:
 * - Keep context providers at root level
 * - Maintain clear separation between customer/admin views
 * - Test view switching thoroughly
 */

import { useState } from 'react';
import { CartProvider, useCart } from '@/context/CartContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { CustomerPage } from '@/pages/CustomerPage';
import { AdminPage } from '@/pages/AdminPage';

type View = 'customer' | 'admin';

function AppContent() {
  const [view, setView] = useState<View>('customer');
  const { items: cartItems, totalItems } = useCart();
  const { logout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleViewChange = (newView: View) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    setView('customer');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        view={view}
        onViewChange={handleViewChange}
        cartItemCount={totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {view === 'customer' ? <CustomerPage /> : <AdminPage />}
      </main>

      {view === 'customer' && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
