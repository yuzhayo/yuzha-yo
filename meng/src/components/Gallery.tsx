/**
 * Gallery Component
 *
 * Purpose: Photo and video gallery showcasing restaurant, food, and ambiance
 *
 * Features:
 * - Masonry/grid layout
 * - Lightbox effect on hover
 * - Responsive grid
 * - Category filtering (optional for future)
 *
 * For Future AI Agents:
 * - Data imported from src/gallery.json
 * - Images from vision_expert_agent
 * - Grid: 1 column mobile, 2 columns tablet, 3-4 columns desktop
 * - Add lightbox library like 'yet-another-react-lightbox' for full-screen view
 * - Categories: food, ambiance, pool, exterior, interior
 */

import galleryData from '../gallery.json'
import type { GalleryItem } from '../types'

const galleryItems = galleryData as GalleryItem[]

const Gallery = () => {
  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
            Gallery
          </h2>
          <p className="text-xl text-gray-600">Explore our ambiance and delicious cuisine</p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 aspect-square"
            >
              <img
                src={item.url}
                alt={item.caption || 'Gallery image'}
                loading="lazy"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                {item.caption && (
                  <p className="text-white text-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Gallery
