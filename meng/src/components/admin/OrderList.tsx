/**
 * OrderList Component - Order Management Interface
 *
 * AI AGENT NOTES:
 * - Admin interface for viewing and managing orders
 * - Table view with all order details
 * - Status management (pending, processing, completed, cancelled)
 * - Order details expansion
 *
 * Features:
 * - Orders table with customer info and items
 * - Status badges with colors
 * - Status update dropdown
 * - Expandable order details
 * - Filter by status
 * - Sort by date (newest first)
 *
 * Props:
 * - orders: Order[] - All orders
 * - onUpdateStatus: (id: string, status: OrderStatus) => void
 *
 * When modifying:
 * - Keep table responsive (consider card view on mobile)
 * - Add pagination if orders list grows
 * - Consider adding date range filter
 * - Add print/export functionality
 */

import React, { useState } from "react";
import type { Order, OrderStatus } from "@/types";
import { formatPrice } from "@/data/menuData";

interface OrderListProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onUpdateStatus }) => {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Filter and sort orders
  const filteredOrders = (
    filterStatus === "all" ? orders : orders.filter((order) => order.status === filterStatus)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Status badge colors
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Status labels
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "processing":
        return "Diproses";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Count orders by status
  const countByStatus = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brown mb-2">Daftar Pesanan</h2>
        <p className="text-brown text-opacity-70">
          Kelola pesanan warung Anda ({orders.length} total)
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filterStatus === "all"
              ? "bg-orange text-white"
              : "bg-white text-brown border-2 border-brown border-opacity-20"
          }`}
        >
          Semua ({countByStatus("all")})
        </button>
        <button
          onClick={() => setFilterStatus("pending")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filterStatus === "pending"
              ? "bg-orange text-white"
              : "bg-white text-brown border-2 border-brown border-opacity-20"
          }`}
        >
          Pending ({countByStatus("pending")})
        </button>
        <button
          onClick={() => setFilterStatus("processing")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filterStatus === "processing"
              ? "bg-orange text-white"
              : "bg-white text-brown border-2 border-brown border-opacity-20"
          }`}
        >
          Diproses ({countByStatus("processing")})
        </button>
        <button
          onClick={() => setFilterStatus("completed")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filterStatus === "completed"
              ? "bg-orange text-white"
              : "bg-white text-brown border-2 border-brown border-opacity-20"
          }`}
        >
          Selesai ({countByStatus("completed")})
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-brown mb-2">Belum Ada Pesanan</h3>
          <p className="text-brown text-opacity-70">
            Pesanan akan muncul di sini setelah pelanggan melakukan pemesanan
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-brown">No. Pesanan</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-brown">Pelanggan</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-brown">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-brown">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-brown">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-brown">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown divide-opacity-10">
                {filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-cream hover:bg-opacity-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-brown">{order.orderNumber}</p>
                          <p className="text-xs text-brown text-opacity-60">
                            {order.items.length} item
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-brown">{order.customer.name}</p>
                          <p className="text-xs text-brown text-opacity-60">
                            {order.customer.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-brown">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-bold text-orange">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className={`px-2 py-1 rounded-full text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-orange ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Diproses</option>
                          <option value="completed">Selesai</option>
                          <option value="cancelled">Dibatalkan</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            setExpandedOrder(expandedOrder === order.id ? null : order.id)
                          }
                          className="p-1.5 text-orange hover:bg-orange hover:bg-opacity-10 rounded transition-colors"
                          aria-label="Toggle details"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform ${
                              expandedOrder === order.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-cream bg-opacity-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Order Items */}
                            <div>
                              <h4 className="font-bold text-brown mb-2">Item Pesanan:</h4>
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-brown">
                                      {item.quantity}x {item.name}
                                    </span>
                                    <span className="font-medium text-brown">
                                      {formatPrice(item.price * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                              <h4 className="font-bold text-brown mb-2">Info Pelanggan:</h4>
                              <div className="text-sm space-y-1">
                                <p className="text-brown">
                                  <strong>Nama:</strong> {order.customer.name}
                                </p>
                                <p className="text-brown">
                                  <strong>Telepon:</strong> {order.customer.phone}
                                </p>
                                <p className="text-brown">
                                  <strong>Alamat:</strong> {order.customer.address}
                                </p>
                                {order.customer.notes && (
                                  <p className="text-brown">
                                    <strong>Catatan:</strong> {order.customer.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
