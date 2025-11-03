/**
 * Cart Context for Warung Meng
 *
 * AI AGENT NOTES:
 * - Global state management for shopping cart
 * - Persists cart data to localStorage
 * - Provides CRUD operations for cart items
 *
 * Context API:
 * - items: CartItem[] - Current cart items
 * - addItem(item: MenuItem) - Add item to cart (or increment quantity)
 * - removeItem(id: string) - Remove item completely from cart
 * - updateQuantity(id: string, quantity: number) - Update item quantity
 * - clearCart() - Empty the entire cart
 * - totalItems: number - Total number of items (sum of quantities)
 * - totalPrice: number - Total price of all items
 *
 * Usage:
 * const { items, addItem, totalPrice } = useCart();
 *
 * When modifying:
 * - Keep localStorage sync in place
 * - Handle edge cases (negative quantities, etc)
 * - Update totalItems and totalPrice calculations if needed
 */

import React, { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { CartItem, MenuItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useLocalStorage<CartItem[]>("meng_cart", []);

  // Add item to cart or increment quantity if already exists
  const addItem = (item: MenuItem) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.id === item.id);
      if (existingItem) {
        // Increment quantity
        return currentItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        // Add new item with quantity 1
        return [...currentItems, { ...item, quantity: 1 }];
      }
    });
  };

  // Remove item completely from cart
  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  // Update item quantity (or remove if quantity <= 0)
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  };

  // Clear all items from cart
  const clearCart = () => {
    setItems([]);
  };

  // Calculate total number of items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total price
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
