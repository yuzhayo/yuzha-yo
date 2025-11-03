/**
 * Hero Component - Landing Section
 *
 * AI AGENT NOTES:
 * - Main hero section for customer landing page
 * - Features restaurant logo, tagline, and CTA buttons
 * - Animated entrance with fade-in and slide-up
 * - Mobile-responsive design
 *
 * Features:
 * - Large logo display
 * - Welcome text and tagline
 * - Primary CTA button (scroll to menu or open menu)
 * - Clean, elegant design matching brand colors
 *
 * Props:
 * - onViewMenu: () => void - Handler for "Lihat Menu" button
 *
 * When modifying:
 * - Keep animations smooth (uses Tailwind animate classes)
 * - Test mobile responsiveness
 * - Ensure CTAs are clearly visible
 */

import React from "react";
import { Button } from "../shared/Button";

interface HeroProps {
  onViewMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewMenu }) => {
  return (
    <section className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-cream to-white px-4 py-12">
      <div className="text-center max-w-3xl mx-auto animate-fade-in">
        {/* Logo */}
        <div className="mb-6 animate-slide-up">
          <img
            src="/logo.png"
            alt="Warung Meng"
            className="w-32 h-32 mx-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brown mb-4">Warung Meng</h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-brown text-opacity-80 mb-8 max-w-2xl mx-auto">
          Restoran kelas atas dengan cita rasa nusantara.
          <br />
          Nikmati hidangan berkualitas dalam suasana yang nyaman dan elegan.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="primary" size="lg" onClick={onViewMenu}>
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Lihat Menu
          </Button>
          <Button variant="outline" size="lg" onClick={onViewMenu}>
            Pesan Sekarang
          </Button>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">🍜</div>
            <h3 className="font-bold text-brown mb-1">Menu Berkualitas</h3>
            <p className="text-sm text-brown text-opacity-70">
              Hidangan nusantara dengan bahan pilihan
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-bold text-brown mb-1">Layanan Cepat</h3>
            <p className="text-sm text-brown text-opacity-70">
              Pesanan Anda siap dalam waktu singkat
            </p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold text-brown mb-1">Rasa Terjamin</h3>
            <p className="text-sm text-brown text-opacity-70">
              Cita rasa yang konsisten dan memuaskan
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
