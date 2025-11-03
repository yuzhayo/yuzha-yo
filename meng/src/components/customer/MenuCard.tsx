/**
 * MenuCard Component - Individual Menu Item Card
 *
 * AI AGENT NOTES:
 * - Card component for displaying individual menu items
 * - Shows image, name, price, description, and badges
 * - Handles add to cart action
 * - Displays sold out state
 * - Responsive design with hover effects
 *
 * Props:
 * - item: MenuItem - The menu item to display
 * - onAddToCart: (item: MenuItem) => void - Handler for add to cart
 *
 * Features:
 * - Image with lazy loading
 * - Badge display (bestseller, recommended, new)
 * - Price formatting (Indonesian Rupiah)
 * - Add to cart button
 * - Sold out overlay
 * - Hover animations
 *
 * When modifying:
 * - Keep image aspect ratio consistent
 * - Test sold out state thoroughly
 * - Ensure price formatting stays consistent
 */

import React from "react";
import type { MenuItem } from "@/types";
import { formatPrice } from "@/data/menuData";
import { Button } from "../shared/Button";

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart }) => {
  const getBadgeColor = (badge: MenuItem["badge"]) => {
    switch (badge) {
      case "bestseller":
        return "bg-orange text-white";
      case "recommended":
        return "bg-gold text-brown";
      case "new":
        return "bg-green-500 text-white";
      default:
        return "";
    }
  };

  const getBadgeLabel = (badge: MenuItem["badge"]) => {
    switch (badge) {
      case "bestseller":
        return "Best Seller";
      case "recommended":
        return "Rekomendasi";
      case "new":
        return "Baru";
      default:
        return "";
    }
  };

  const isSoldOut = item.status === "soldout";

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isSoldOut ? "opacity-60" : ""
      }`}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Badge */}
        {item.badge && !isSoldOut && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getBadgeColor(
              item.badge,
            )}`}
          >
            {getBadgeLabel(item.badge)}
          </div>
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
              Habis
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-orange font-medium mb-1">{item.category}</p>

        {/* Name */}
        <h3 className="text-lg font-bold text-brown mb-2 line-clamp-1">{item.name}</h3>

        {/* Description */}
        <p className="text-sm text-brown text-opacity-70 mb-3 line-clamp-2">{item.description}</p>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-orange">{formatPrice(item.price)}</span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAddToCart(item)}
            disabled={isSoldOut}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Tambah
          </Button>
        </div>
      </div>
    </div>
  );
};
