/**
 * TypeScript Type Definitions for Warung Meng
 *
 * AI AGENT NOTES:
 * - All data structures for menu items, orders, and cart
 * - Keep these types in sync with data/menuData.ts
 * - When adding new fields, update CRUD functions accordingly
 *
 * Type Hierarchy:
 * - MenuItem: Individual menu item with all details
 * - CartItem: MenuItem + quantity for shopping cart
 * - Order: Complete order with customer info and items
 * - Category: Menu categories (Makanan, Minuman, Snack, Dessert)
 *
 * Status Enums:
 * - MenuStatus: 'available' | 'soldout'
 * - OrderStatus: 'pending' | 'processing' | 'completed' | 'cancelled'
 */

/**
 * Menu item categories
 */
export type MenuCategory = "Makanan Utama" | "Minuman" | "Snack" | "Dessert";

/**
 * Menu item status (stock availability)
 */
export type MenuStatus = "available" | "soldout";

/**
 * Badge types for special menu items
 */
export type MenuBadge = "bestseller" | "recommended" | "new" | null;

/**
 * Order status for tracking
 */
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

/**
 * Menu Item Interface
 * Represents a single item on the menu
 */
export interface MenuItem {
  id: string; // Unique identifier (UUID format recommended)
  name: string; // Display name of the menu item
  description: string; // Short description
  price: number; // Price in Rupiah
  category: MenuCategory; // Which category this belongs to
  image: string; // URL or path to image
  status: MenuStatus; // Stock availability
  badge: MenuBadge; // Special badge if any
}

/**
 * Cart Item Interface
 * Menu item with quantity for shopping cart
 */
export interface CartItem extends MenuItem {
  quantity: number; // How many of this item in cart
}

/**
 * Customer Info Interface
 * Information collected during checkout
 */
export interface CustomerInfo {
  name: string; // Customer name
  phone: string; // Contact number
  address: string; // Delivery address or table number
  notes?: string; // Optional order notes
}

/**
 * Order Interface
 * Complete order with all information
 */
export interface Order {
  id: string; // Unique order ID
  orderNumber: string; // Display-friendly order number (e.g., "ORD-001")
  customer: CustomerInfo; // Customer details
  items: CartItem[]; // Ordered items with quantities
  total: number; // Total price in Rupiah
  status: OrderStatus; // Current order status
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Warung Info Interface
 * Restaurant information
 */
export interface WarungInfo {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hours: string;
  phone: string;
}

/**
 * Admin Credentials Interface
 * For simple authentication
 */
export interface AdminCredentials {
  username: string;
  password: string;
}
