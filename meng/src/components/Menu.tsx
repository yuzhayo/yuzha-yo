/**
 * Menu Component
 *
 * Purpose: Display featured and main menu items
 *
 * Features:
 * - Grid layout for menu items
 * - Featured section highlight
 * - Responsive cards with images
 * - Hover effects
 *
 * For Future AI Agents:
 * - Data imported from src/menu.json
 * - Images from vision_expert_agent
 * - Grid: 1 column mobile, 2 columns tablet, 3 columns desktop
 * - Featured items shown first
 * - Add new items by updating menu.json
 */

import menuData from '../menu.json'
import type { MenuItem } from '../types'

const menuItems = menuData as MenuItem[]

const Menu = () => {
  const featuredItems = menuItems.filter((item) => item.category === 'featured')
  const mainItems = menuItems.filter((item) => item.category === 'main')

  return (
    <section id="menu" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
            Menu Favorit
          </h2>
          <p className="text-xl text-gray-600">The Plantation Cafe</p>
        </div>

        {/* Featured Items */}
        <div className="mb-16">
          <h3 className="text-2xl font-display font-semibold text-gray-900 mb-8 text-center">
            This or That
          </h3>
          <p className="text-center text-gray-600 mb-8">Favorit kalian yang mana nih ??</p>
          <p className="text-center text-gray-600 mb-12">Iga Bakar atau Hot Plate Singapore</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-2xl font-display font-semibold text-gray-900 mb-3">
                    {item.name}
                  </h4>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Menu Items */}
        {mainItems.length > 0 && (
          <div>
            <h3 className="text-2xl font-display font-semibold text-gray-900 mb-8 text-center">
              Our Specialties
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mainItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Menu
