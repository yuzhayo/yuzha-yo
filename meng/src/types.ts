/**
 * Shared Type Definitions
 *
 * Components remain static while content comes from JSON files.
 */

export interface MenuItem {
  id: string
  name: string
  description: string
  imageUrl: string
  category: 'featured' | 'main' | 'appetizer' | 'dessert' | 'beverage'
}

export interface GalleryItem {
  id: string
  url: string
  type: 'image' | 'video'
  caption?: string
  category: 'food' | 'ambiance' | 'pool' | 'exterior' | 'interior'
}

export interface ContactContent {
  heading: string
  subheading: string
  cards: {
    phone: { title: string; value: string }
    location: { title: string; lines: string[] }
    hours: { title: string; days: string; hours: string }
  }
  whatsapp: { number: string; message: string; label: string }
  ctaNote: string
}
