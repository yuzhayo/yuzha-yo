/**
 * Menu Data and CRUD Functions for Warung Meng
 *
 * AI AGENT NOTES:
 * - This file contains all dummy data and data management functions
 * - Data is persisted to localStorage for demo purposes
 * - In production, replace with API calls to backend
 *
 * LocalStorage Keys:
 * - 'meng_menu_items': Array<MenuItem>
 * - 'meng_orders': Array<Order>
 * - 'meng_admin_auth': boolean
 *
 * CRUD Functions:
 * - getMenuItems(): Fetch all menu items
 * - addMenuItem(): Add new menu item (admin)
 * - updateMenuItem(): Update existing item (admin)
 * - deleteMenuItem(): Delete item (admin)
 * - getOrders(): Fetch all orders
 * - addOrder(): Create new order
 * - updateOrderStatus(): Update order status (admin)
 *
 * When modifying:
 * - Keep dummy data realistic for demo
 * - Ensure IDs are unique (use crypto.randomUUID() or similar)
 * - Handle localStorage errors gracefully
 */

import type { MenuItem, Order, WarungInfo, MenuCategory } from "@/types";

/**
 * Restaurant Information
 * Location: Surabaya, Indonesia
 */
export const warungInfo: WarungInfo = {
  name: "Warung Meng",
  address: "Jl. Raya Darmo No. 123, Surabaya, Jawa Timur 60264",
  coordinates: {
    lat: -7.49434,
    lng: 112.720825,
  },
  hours: "08.00 - 22.00 WIB",
  phone: "+62 812-3456-7890",
};

/**
 * Initial Menu Items
 * 20 items covering all categories with Surabaya signature dishes
 */
export const initialMenuItems: MenuItem[] = [
  // Makanan Utama (8 items)
  {
    id: "1",
    name: "Rawon Setan",
    description: "Rawon daging sapi dengan kuah hitam pekat, dilengkapi telur asin dan sambal",
    price: 25000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400",
    status: "available",
    badge: "bestseller",
  },
  {
    id: "2",
    name: "Soto Ayam Lamongan",
    description: "Soto ayam khas Lamongan dengan kuah bening, koya khas, dan jeruk nipis",
    price: 18000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "3",
    name: "Nasi Goreng Kambing",
    description: "Nasi goreng dengan daging kambing pilihan, telur mata sapi, dan kerupuk",
    price: 28000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
    status: "available",
    badge: "recommended",
  },
  {
    id: "4",
    name: "Tahu Tek",
    description: "Tahu goreng, lontong, tauge dengan bumbu petis dan saus kacang",
    price: 15000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "5",
    name: "Lontong Balap",
    description: "Lontong dengan tauge, tahu goreng, lentho, dan kuah petis khas Surabaya",
    price: 12000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "6",
    name: "Rujak Cingur",
    description: "Rujak khas Surabaya dengan cingur (hidung sapi), petis, dan sayuran segar",
    price: 20000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "7",
    name: "Ayam Bakar Madu",
    description: "Ayam bakar dengan olesan madu, sambal, dan lalapan segar",
    price: 30000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
    status: "available",
    badge: "recommended",
  },
  {
    id: "8",
    name: "Pecel Lele",
    description: "Lele goreng crispy dengan sambal terasi dan lalapan lengkap",
    price: 22000,
    category: "Makanan Utama",
    image: "https://images.unsplash.com/photo-1588347818036-4c0fd06b7a5c?w=400",
    status: "available",
    badge: null,
  },
  // Minuman (5 items)
  {
    id: "9",
    name: "Es Teh Poci",
    description: "Es teh manis khas dengan teh poci asli",
    price: 5000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "10",
    name: "Kopi Susu Gula Aren",
    description: "Kopi susu dengan gula aren asli, creamy dan tidak terlalu manis",
    price: 12000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
    status: "available",
    badge: "bestseller",
  },
  {
    id: "11",
    name: "Es Jeruk Peras",
    description: "Jeruk peras segar dengan es batu, menyegarkan",
    price: 8000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "12",
    name: "Jus Alpukat",
    description: "Jus alpukat segar dengan susu coklat, creamy dan mengenyangkan",
    price: 15000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "13",
    name: "Es Kelapa Muda",
    description: "Air kelapa muda segar dengan daging kelapa, sangat menyegarkan",
    price: 10000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400",
    status: "available",
    badge: null,
  },
  // Snack (3 items)
  {
    id: "14",
    name: "Pisang Goreng Keju",
    description: "Pisang goreng crispy dengan topping keju dan coklat meses",
    price: 12000,
    category: "Snack",
    image: "https://images.unsplash.com/photo-1587132117816-5f0cf3c1c95f?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "15",
    name: "Tahu Crispy",
    description: "Tahu goreng tepung crispy dengan saus sambal dan mayones",
    price: 10000,
    category: "Snack",
    image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "16",
    name: "Kentang Goreng",
    description: "French fries dengan bumbu BBQ atau keju",
    price: 15000,
    category: "Snack",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
    status: "available",
    badge: null,
  },
  // Dessert (4 items)
  {
    id: "17",
    name: "Es Campur Surabaya",
    description: "Es campur dengan agar-agar, kolang-kaling, alpukat, dan sirup merah",
    price: 18000,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
    status: "available",
    badge: "recommended",
  },
  {
    id: "18",
    name: "Kolak Pisang",
    description: "Kolak pisang kepok dengan kuah santan manis dan daun pandan",
    price: 10000,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "19",
    name: "Puding Coklat",
    description: "Puding coklat lembut dengan vla vanilla",
    price: 8000,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
    status: "available",
    badge: null,
  },
  {
    id: "20",
    name: "Klepon",
    description: "Klepon isi gula merah dengan taburan kelapa parut (5 pcs)",
    price: 8000,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400",
    status: "available",
    badge: "new",
  },
];

/**
 * Get all menu items from localStorage or return initial data
 */
export const getMenuItems = (): MenuItem[] => {
  try {
    const stored = localStorage.getItem("meng_menu_items");
    if (stored) {
      return JSON.parse(stored) as MenuItem[];
    }
    // Initialize with default data
    localStorage.setItem("meng_menu_items", JSON.stringify(initialMenuItems));
    return initialMenuItems;
  } catch (error) {
    console.error("[MenuData] Error loading menu items:", error);
    return initialMenuItems;
  }
};

/**
 * Save menu items to localStorage
 */
export const saveMenuItems = (items: MenuItem[]): void => {
  try {
    localStorage.setItem("meng_menu_items", JSON.stringify(items));
  } catch (error) {
    console.error("[MenuData] Error saving menu items:", error);
  }
};

/**
 * Add new menu item (Admin function)
 */
export const addMenuItem = (item: Omit<MenuItem, "id">): MenuItem => {
  const newItem: MenuItem = {
    ...item,
    id: crypto.randomUUID(),
  };
  const items = getMenuItems();
  items.push(newItem);
  saveMenuItems(items);
  return newItem;
};

/**
 * Update existing menu item (Admin function)
 */
export const updateMenuItem = (id: string, updates: Partial<MenuItem>): MenuItem | null => {
  const items = getMenuItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  items[index] = { ...items[index], ...updates };
  saveMenuItems(items);
  return items[index];
};

/**
 * Delete menu item (Admin function)
 */
export const deleteMenuItem = (id: string): boolean => {
  const items = getMenuItems();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;

  saveMenuItems(filtered);
  return true;
};

/**
 * Get all orders from localStorage
 */
export const getOrders = (): Order[] => {
  try {
    const stored = localStorage.getItem("meng_orders");
    return stored ? (JSON.parse(stored) as Order[]) : [];
  } catch (error) {
    console.error("[MenuData] Error loading orders:", error);
    return [];
  }
};

/**
 * Save orders to localStorage
 */
export const saveOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem("meng_orders", JSON.stringify(orders));
  } catch (error) {
    console.error("[MenuData] Error saving orders:", error);
  }
};

/**
 * Add new order
 */
export const addOrder = (
  order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">,
): Order => {
  const orders = getOrders();
  const orderNumber = `ORD-${String(orders.length + 1).padStart(4, "0")}`;
  const timestamp = new Date().toISOString();

  const newOrder: Order = {
    ...order,
    id: crypto.randomUUID(),
    orderNumber,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
};

/**
 * Update order status (Admin function)
 */
export const updateOrderStatus = (id: string, status: Order["status"]): Order | null => {
  const orders = getOrders();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;

  orders[index] = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  saveOrders(orders);
  return orders[index];
};

/**
 * Get menu categories
 */
export const getCategories = (): MenuCategory[] => {
  return ["Makanan Utama", "Minuman", "Snack", "Dessert"];
};

/**
 * Format price to Indonesian Rupiah
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};
