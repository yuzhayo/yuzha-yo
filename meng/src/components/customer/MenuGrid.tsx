/**
 * MenuGrid Component - Menu Display with Filters
 * 
 * AI AGENT NOTES:
 * - Main component for displaying menu items in a grid
 * - Includes category filter tabs
 * - Search functionality
 * - Responsive grid layout
 * - Empty state when no items match filters
 * 
 * Props:
 * - items: MenuItem[] - All available menu items
 * - onAddToCart: (item: MenuItem) => void - Handler for adding items to cart
 * 
 * State:
 * - selectedCategory: MenuCategory | 'all' - Current filter
 * - searchQuery: string - Search input value
 * 
 * Features:
 * - Category tabs with counts
 * - Real-time search filtering
 * - Responsive grid (1-4 columns based on screen size)
 * - Smooth transitions
 * - Empty state message
 * 
 * When modifying:
 * - Keep filter logic efficient for large lists
 * - Test search with Indonesian characters
 * - Ensure grid responsiveness on all devices
 */

import React, { useState, useMemo } from 'react';
import type { MenuItem, MenuCategory } from '@/types';
import { getCategories } from '@/data/menuData';
import { MenuCard } from './MenuCard';

interface MenuGridProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getCategories();

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery]);

  // Count items per category
  const getCategoryCount = (category: MenuCategory | 'all') => {
    if (category === 'all') return items.length;
    return items.filter((item) => item.category === category).length;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Cari menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-brown border-opacity-20 focus:border-orange focus:outline-none transition-colors"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-brown text-opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-orange text-white shadow-md'
              : 'bg-white text-brown hover:bg-cream border-2 border-brown border-opacity-20'
          }`}
        >
          Semua ({getCategoryCount('all')})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category
                ? 'bg-orange text-white shadow-md'
                : 'bg-white text-brown hover:bg-cream border-2 border-brown border-opacity-20'
            }`}
          >
            {category} ({getCategoryCount(category)})
          </button>
        ))}
      </div>

      {/* Results Info */}
      <div className="text-sm text-brown text-opacity-70">
        Menampilkan {filteredItems.length} menu
        {searchQuery && ` untuk "${searchQuery}"`}
      </div>

      {/* Menu Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-brown mb-2">Menu tidak ditemukan</h3>
          <p className="text-brown text-opacity-70">
            Coba kata kunci lain atau pilih kategori berbeda
          </p>
        </div>
      )}
    </div>
  );
};
