/**
 * TypeScript Type Definitions for Plantation Cafe Resto
 *
 * Purpose: Define interfaces and types used throughout the application
 *
 * For Future AI Agents:
 * - All components use these types for type safety
 * - Modify these when adding new features
 * - Keep interfaces simple and descriptive
 * - Export all types for reusability
 */

/**
 * MenuItem Interface
 * Represents a menu item in the restaurant
 */
export interface MenuItem {
  id: string
  name: string
  description: string
  imageUrl: string
  category: 'featured' | 'main' | 'appetizer' | 'dessert' | 'beverage'
}

/**
 * GalleryItem Interface
 * Represents an image or video in the gallery
 */
export interface GalleryItem {
  id: string
  url: string
  type: 'image' | 'video'
  caption?: string
  category: 'food' | 'ambiance' | 'pool' | 'exterior' | 'interior'
}

/**
 * ContactInfo Interface
 * Contact information for the restaurant
 */
export interface ContactInfo {
  phone: string
  whatsapp: string
  address: string
  hours: string
}
