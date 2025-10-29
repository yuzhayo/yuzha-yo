/**
 * MenuManager Component - Menu CRUD Interface
 * 
 * AI AGENT NOTES:
 * - Admin interface for managing menu items
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Table view with inline actions
 * - Modal form for add/edit
 * 
 * Features:
 * - Menu items table with all details
 * - Add new item button
 * - Edit existing items
 * - Delete with confirmation
 * - Toggle availability (available/soldout)
 * - Badge management
 * - Search/filter by category
 * 
 * State Management:
 * - items: MenuItem[] - All menu items
 * - isModalOpen: boolean - Form modal state
 * - editingItem: MenuItem | null - Item being edited
 * 
 * When modifying:
 * - Keep table responsive on mobile (consider card view)
 * - Add image upload capability (currently URL input)
 * - Validate form inputs thoroughly
 * - Add bulk actions if needed
 */

import React, { useState } from 'react';
import type { MenuItem, MenuCategory, MenuStatus, MenuBadge } from '@/types';
import { getCategories, formatPrice } from '@/data/menuData';
import { Button } from '../shared/Button';

interface MenuManagerProps {
  items: MenuItem[];
  onAdd: (item: Omit<MenuItem, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<MenuItem>) => void;
  onDelete: (id: string) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  items,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<MenuCategory | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = getCategories();

  // Filter items by category
  const filteredItems =
    filterCategory === 'all'
      ? items
      : items.filter((item) => item.category === filterCategory);

  // Open add/edit modal
  const handleOpenModal = (item?: MenuItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  // Toggle status
  const handleToggleStatus = (item: MenuItem) => {
    const newStatus: MenuStatus =
      item.status === 'available' ? 'soldout' : 'available';
    onUpdate(item.id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brown mb-2">Manajemen Menu</h2>
          <p className="text-brown text-opacity-70">
            Kelola menu warung Anda ({items.length} item)
          </p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
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
          Tambah Menu
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filterCategory === 'all'
              ? 'bg-orange text-white'
              : 'bg-white text-brown border-2 border-brown border-opacity-20'
          }`}
        >
          Semua ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterCategory === cat
                ? 'bg-orange text-white'
                : 'bg-white text-brown border-2 border-brown border-opacity-20'
            }`}
          >
            {cat} ({items.filter((item) => item.category === cat).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-brown">Menu</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-brown">Kategori</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-brown">Harga</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-brown">Status</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-brown">Badge</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-brown">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown divide-opacity-10">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-cream hover:bg-opacity-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-brown">{item.name}</p>
                        <p className="text-xs text-brown text-opacity-60 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-brown">{item.category}</td>
                  <td className="px-4 py-3 text-sm font-medium text-brown">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status === 'available' ? 'Tersedia' : 'Habis'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-brown">
                    {item.badge ? (
                      <span className="capitalize">{item.badge}</span>
                    ) : (
                      <span className="text-brown text-opacity-40">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        aria-label="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`p-1.5 rounded transition-colors ${
                          deleteConfirm === item.id
                            ? 'bg-red-500 text-white'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        aria-label="Delete"
                      >
                        {deleteConfirm === item.id ? (
                          <span className="text-xs font-bold px-1">Yakin?</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <MenuFormModal
          item={editingItem}
          onClose={handleCloseModal}
          onSubmit={(data) => {
            if (editingItem) {
              onUpdate(editingItem.id, data);
            } else {
              onAdd(data);
            }
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

/**
 * MenuFormModal - Form for adding/editing menu items
 */
interface MenuFormModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<MenuItem, 'id'>) => void;
}

const MenuFormModal: React.FC<MenuFormModalProps> = ({ item, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || 'Makanan Utama',
    image: item?.image || '',
    status: item?.status || 'available',
    badge: item?.badge || null,
  });

  const categories = getCategories();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-brown mb-6">
              {item ? 'Edit Menu' : 'Tambah Menu Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-brown border-opacity-20 rounded-lg focus:border-orange focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as MenuCategory })
                    }
                    className="w-full px-3 py-2 border-2 border-brown border-opacity-20 rounded-lg focus:border-orange focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-brown border-opacity-20 rounded-lg focus:border-orange focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    min="0"
                    className="w-full px-3 py-2 border-2 border-brown border-opacity-20 rounded-lg focus:border-orange focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as MenuStatus })
                    }
                    className="w-full px-3 py-2 border-2 border-brown border-opacity-20 rounded-lg focus:border-orange focus:outline-none"
                  >
                    <option value="available">Tersedia</option>
                    <option value="soldout">Habis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">
                  URL Gambar
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-brown border-opacity-20 rounded-lg focus:border-orange focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">
                  Badge (Opsional)
                </label>
                <select
                  value={formData.badge || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      badge: (e.target.value || null) as MenuBadge,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-brown border-opacity-20 rounded-lg focus:border-orange focus:outline-none"
                >
                  <option value="">Tidak ada</option>
                  <option value="bestseller">Best Seller</option>
                  <option value="recommended">Rekomendasi</option>
                  <option value="new">Baru</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" fullWidth onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" fullWidth>
                  {item ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
