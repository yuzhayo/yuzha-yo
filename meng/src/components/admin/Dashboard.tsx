/**
 * Dashboard Component - Admin Overview
 * 
 * AI AGENT NOTES:
 * - Admin dashboard with key statistics
 * - Shows summary cards for quick insights
 * - Real-time data from localStorage
 * 
 * Stats Displayed:
 * - Total menu items
 * - Available vs sold out items
 * - Total orders
 * - Pending orders count
 * - Revenue (sum of completed orders)
 * 
 * Features:
 * - Stat cards with icons
 * - Color-coded for quick scanning
 * - Responsive grid layout
 * - Auto-updates when data changes
 * 
 * When modifying:
 * - Keep calculations efficient
 * - Add more stats as needed (daily orders, popular items, etc)
 * - Consider adding charts for better visualization
 */

import React from 'react';
import type { MenuItem, Order } from '@/types';

interface DashboardProps {
  menuItems: MenuItem[];
  orders: Order[];
}

export const Dashboard: React.FC<DashboardProps> = ({ menuItems, orders }) => {
  // Calculate stats
  const totalItems = menuItems.length;
  const availableItems = menuItems.filter((item) => item.status === 'available').length;
  const soldOutItems = menuItems.filter((item) => item.status === 'soldout').length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const completedOrders = orders.filter((order) => order.status === 'completed').length;
  const totalRevenue = orders
    .filter((order) => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brown mb-2">Dashboard</h2>
        <p className="text-brown text-opacity-70">Overview warung Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Menu Items */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brown text-opacity-70 mb-1">Total Menu</p>
              <p className="text-3xl font-bold text-brown">{totalItems}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>

        {/* Available Items */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brown text-opacity-70 mb-1">Tersedia</p>
              <p className="text-3xl font-bold text-brown">{availableItems}</p>
              {soldOutItems > 0 && (
                <p className="text-xs text-red-500 mt-1">{soldOutItems} habis</p>
              )}
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brown text-opacity-70 mb-1">Total Pesanan</p>
              <p className="text-3xl font-bold text-brown">{totalOrders}</p>
              <p className="text-xs text-brown text-opacity-70 mt-1">
                {completedOrders} selesai
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brown text-opacity-70 mb-1">Pending</p>
              <p className="text-3xl font-bold text-brown">{pendingOrders}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-orange to-gold rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white text-opacity-90 mb-1">Total Pendapatan</p>
            <p className="text-4xl font-bold">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-white text-opacity-90 mt-2">
              Dari {completedOrders} pesanan selesai
            </p>
          </div>
          <div className="text-6xl">💰</div>
        </div>
      </div>
    </div>
  );
};
