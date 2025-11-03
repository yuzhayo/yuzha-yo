/**
 * AdminPage - Admin Dashboard with Login
 *
 * AI AGENT NOTES:
 * - Admin panel with authentication wall
 * - Tabs for different management sections
 * - Full CRUD operations for menu and orders
 * - Dashboard statistics
 *
 * Authentication:
 * - Uses AuthContext for login state
 * - Login form with credentials (demo: admin/admin123)
 * - Logout functionality
 *
 * Tabs:
 * - Dashboard: Statistics overview
 * - Menu: Menu management (CRUD)
 * - Orders: Order management
 *
 * Features:
 * - Protected routes (must login first)
 * - Tab navigation
 * - Real-time data updates
 * - Responsive design
 *
 * When modifying:
 * - Replace demo auth with real authentication
 * - Add more admin features (reports, settings, etc)
 * - Consider role-based permissions
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getOrders,
  updateOrderStatus,
} from "@/data/menuData";
import type { MenuItem, Order, OrderStatus } from "@/types";
import { Button } from "@/components/shared/Button";
import { Dashboard } from "@/components/admin/Dashboard";
import { MenuManager } from "@/components/admin/MenuManager";
import { OrderList } from "@/components/admin/OrderList";

type AdminTab = "dashboard" | "menu" | "orders";

export const AdminPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load data
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = () => {
    setMenuItems(getMenuItems());
    setOrders(getOrders());
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = login(username, password);

    if (success) {
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Username atau password salah");
    }

    setIsLoggingIn(false);
  };

  // Menu CRUD handlers
  const handleAddMenuItem = (item: Omit<MenuItem, "id">) => {
    addMenuItem(item);
    loadData();
  };

  const handleUpdateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    updateMenuItem(id, updates);
    loadData();
  };

  const handleDeleteMenuItem = (id: string) => {
    deleteMenuItem(id);
    loadData();
  };

  // Order handler
  const handleUpdateOrderStatus = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
    loadData();
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Warung Meng" className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brown mb-2">Admin Login</h2>
            <p className="text-brown text-opacity-70">Masuk untuk mengelola warung Anda</p>
          </div>

          {/* Demo Credentials Info */}
          <div className="bg-gold bg-opacity-20 border-2 border-gold rounded-lg p-3 mb-6">
            <p className="text-xs text-brown text-center">
              <strong>Demo Login:</strong>
              <br />
              Username: <code className="bg-white px-1 rounded">admin</code>
              <br />
              Password: <code className="bg-white px-1 rounded">admin123</code>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-brown mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-brown border-opacity-20 focus:border-orange focus:outline-none transition-colors"
                placeholder="Masukkan username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brown mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-brown border-opacity-20 focus:border-orange focus:outline-none transition-colors"
                placeholder="Masukkan password"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoggingIn}
              disabled={isLoggingIn}
            >
              Login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated admin view
  return (
    <div className="min-h-screen bg-cream">
      {/* Tab Navigation */}
      <div className="bg-white border-b-2 border-brown border-opacity-10 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-2 font-medium transition-colors relative ${
                activeTab === "dashboard"
                  ? "text-orange"
                  : "text-brown text-opacity-60 hover:text-brown"
              }`}
            >
              Dashboard
              {activeTab === "dashboard" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`py-4 px-2 font-medium transition-colors relative ${
                activeTab === "menu" ? "text-orange" : "text-brown text-opacity-60 hover:text-brown"
              }`}
            >
              Menu
              {activeTab === "menu" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-2 font-medium transition-colors relative ${
                activeTab === "orders"
                  ? "text-orange"
                  : "text-brown text-opacity-60 hover:text-brown"
              }`}
            >
              Pesanan
              {orders.filter((o) => o.status === "pending").length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 inline-flex items-center justify-center">
                  {orders.filter((o) => o.status === "pending").length}
                </span>
              )}
              {activeTab === "orders" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "dashboard" && <Dashboard menuItems={menuItems} orders={orders} />}
        {activeTab === "menu" && (
          <MenuManager
            items={menuItems}
            onAdd={handleAddMenuItem}
            onUpdate={handleUpdateMenuItem}
            onDelete={handleDeleteMenuItem}
          />
        )}
        {activeTab === "orders" && (
          <OrderList orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
        )}
      </div>
    </div>
  );
};
