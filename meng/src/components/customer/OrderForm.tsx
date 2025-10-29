/**
 * OrderForm Component - Checkout Form
 * 
 * AI AGENT NOTES:
 * - Customer information form for checkout
 * - Collects name, phone, address, and optional notes
 * - Form validation before submission
 * - Creates order and shows confirmation
 * 
 * Props:
 * - items: CartItem[] - Items being ordered
 * - totalPrice: number - Total order price
 * - onSubmit: (customer: CustomerInfo) => void - Submit order
 * - onCancel: () => void - Cancel and go back
 * 
 * Features:
 * - Input validation (required fields)
 * - Phone number formatting
 * - Order summary display
 * - Loading state during submission
 * - Success confirmation with order number
 * 
 * When modifying:
 * - Keep validation strict for required fields
 * - Test phone number formats (Indonesian)
 * - Ensure form is mobile-friendly
 */

import React, { useState } from 'react';
import type { CartItem, CustomerInfo } from '@/types';
import { formatPrice } from '@/data/menuData';
import { Button } from '../shared/Button';

interface OrderFormProps {
  items: CartItem[];
  totalPrice: number;
  onSubmit: (customer: CustomerInfo) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  items,
  totalPrice,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  // Validate form
  const validate = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof CustomerInfo]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-brown mb-6">Informasi Pemesanan</h2>

      {/* Order Summary */}
      <div className="bg-cream rounded-lg p-4 mb-6">
        <h3 className="font-bold text-brown mb-3">Ringkasan Pesanan</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-brown">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium text-brown">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="border-t border-brown border-opacity-20 pt-2 mt-2 flex justify-between font-bold">
            <span className="text-brown">Total</span>
            <span className="text-orange text-lg">{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-brown mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border-2 ${
              errors.name ? 'border-red-500' : 'border-brown border-opacity-20'
            } focus:border-orange focus:outline-none transition-colors`}
            placeholder="Masukkan nama lengkap"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-brown mb-1">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border-2 ${
              errors.phone ? 'border-red-500' : 'border-brown border-opacity-20'
            } focus:border-orange focus:outline-none transition-colors`}
            placeholder="08xx xxxx xxxx"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-brown mb-1">
            Alamat Pengiriman / Nomor Meja <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border-2 ${
              errors.address ? 'border-red-500' : 'border-brown border-opacity-20'
            } focus:border-orange focus:outline-none transition-colors`}
            placeholder="Alamat lengkap atau nomor meja"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-brown mb-1">
            Catatan (Opsional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border-2 border-brown border-opacity-20 focus:border-orange focus:outline-none transition-colors resize-none"
            placeholder="Tambahkan catatan untuk pesanan (mis: tidak pedas, tanpa bawang, dll)"
          />
        </div>

        {/* Info Box */}
        <div className="bg-gold bg-opacity-20 border-2 border-gold rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-brown flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-brown">
              <p className="font-bold mb-1">Informasi Pembayaran</p>
              <p>
                Pesanan Anda akan diproses setelah konfirmasi. Pembayaran dapat dilakukan
                saat pesanan tiba atau di kasir.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Konfirmasi Pesanan
          </Button>
        </div>
      </form>
    </div>
  );
};
