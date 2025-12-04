# Plantation Cafe Resto - Codebase Guide

## ðŸ“‹ Overview

This is a modern, fully responsive website for **The Plantation Cafe & Resto** - a garden-concept restaurant in Bandung, Indonesia. Built with React 18, TypeScript, Tailwind CSS, and Vite.

## ðŸŽ¯ Purpose

Replicate the original website at https://plantationcaferesto.com/ with modern tech stack and improved user experience.

## ðŸ—ï¸ Architecture

### Tech Stack

- **Frontend Framework:** React 18.2.0
- **Language:** TypeScript 5.2.2
- **Build Tool:** Vite 5.0.8
- **Styling:** Tailwind CSS 3.3.6
- **Icons:** Inline SVG (local icons, no external library)
- **Code Quality:** ESLint + Prettier

### Project Structure

```
/app/meng/
└─ src/
   ├─ components/      # React components
   ├─ menu.json        # Menu content (JSON-driven)
   ├─ gallery.json     # Gallery content (JSON-driven)
   ├─ contact.json     # Contact content (JSON-driven)
   ├─ types.ts         # Shared TypeScript types
   ├─ App.tsx          # Main app component
   ├─ main.tsx         # Entry point
   └─ index.css        # Global styles + Tailwind
public/                # Static assets
dist/                  # Build output
index.html             # HTML template
package.json           # Dependencies
tsconfig.json          # TypeScript config
vite.config.ts         # Vite config
tailwind.config.ts     # Tailwind config
postcss.config.cjs     # PostCSS config
.eslintrc.json         # ESLint rules
.prettierrc            # Prettier config
```

## ðŸ”§ Key Components

### 1. Navbar (`src/components/Navbar.tsx`)

- **Purpose:** Fixed top navigation
- **Features:** Smooth scroll, mobile menu, responsive
- **State:** `isMenuOpen` for mobile menu toggle
- **Links:** Home, About, Menu, Gallery, Contact

### 2. Hero (`src/components/Hero.tsx`)

- **Purpose:** Full-screen hero banner
- **Image:** Garden restaurant with outdoor seating
- **CTA:** "View Menu" button scrolls to menu section

### 3. About (`src/components/About.tsx`)

- **Purpose:** About Us (Tentang Kami) section
- **Layout:** Two-column (image + text)
- **Features:** Mountain view, Swimming pool, Garden concept
- **Text:** Indonesian language content from original site

### 4. Menu (`src/components/Menu.tsx`)

- **Purpose:** Display menu items
- **Data Source:** `src/menu.json`
- **Sections:** Featured items (Iga Bakar, Hot Plate Singapore) + Main items
- **Layout:** Responsive grid

### 5. Gallery (`src/components/Gallery.tsx`)

- **Purpose:** Photo gallery
- **Data Source:** `src/gallery.json`
- **Features:** Hover effects, responsive grid
- **Categories:** food, ambiance, pool, exterior, interior

### 6. Contact (`src/components/Contact.tsx`)

- **Purpose:** Contact information and WhatsApp CTA
- **WhatsApp:** 0811-1658-033
- **Features:** Phone, Location, Hours cards
- **CTA:** WhatsApp button with pre-filled message

### 7. Footer (`src/components/Footer.tsx`)

- **Purpose:** Website footer
- **Content:** Copyright, tagline
- **Dynamic:** Current year auto-updates

## ðŸ“Š Data Management

### Menu Items (`src/menu.json`)

```json
[
  {
    "id": "iga-bakar",
    "name": "Iga Bakar",
    "description": "...",
    "imageUrl": "https://...",
    "category": "featured"
  }
]
```

**To Add New Items:**

1. Open `src/menu.json`
2. Add, edit, or remove objects following the shape above
3. Save; the Menu component auto-updates

### Gallery Items (`src/gallery.json`)

```json
[
  {
    "id": "gallery-1",
    "url": "https://...",
    "type": "image",
    "caption": "...",
    "category": "interior"
  }
]
```

**To Add New Images:**

1. Open `src/gallery.json`
2. Add, edit, or remove objects following the shape above
3. Save; the Gallery component auto-updates

## ðŸŽ¨ Styling System

### Tailwind Configuration

- **Primary Color:** Green (garden theme) - `primary-600`
- **Secondary Color:** Warm gold - `secondary-500`
- **Fonts:**
  - Display/Headings: Poppins
  - Body: Inter
- **Custom Animations:**
  - `animate-fade-in`: Fade in effect
  - `animate-slide-up`: Slide up from bottom
  - `animate-scale-in`: Scale in effect

### Responsive Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## ðŸš€ Development Commands

```bash
# Install dependencies
npm install

# Start dev server (port 3001)
npm run dev

# Type check
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

## âœ… Quality Checks

### TypeScript

- Strict mode enabled
- No implicit any
- All components fully typed
- Run: `npm run typecheck`

### ESLint

- React hooks rules
- TypeScript rules
- No unused variables
- Run: `npm run lint`

### Prettier

- Single quotes
- No semicolons
- 2 space tabs
- Run: `npm run format`

## ðŸ–¼ï¸ Image Sources

All images sourced from:

- **Unsplash** (high-quality, royalty-free)
- **Pexels** (high-quality, royalty-free)

Images selected via `vision_expert_agent` based on:

1. Restaurant outdoor garden ambiance
2. Mountain view settings
3. Indonesian cuisine (Iga Bakar, Hot Plate)
4. Swimming pool with city views
5. Cafe interior/exterior

## ðŸ”„ Future Enhancements

### Recommended Additions:

1. **Lightbox for Gallery:** Install `yet-another-react-lightbox`
2. **Form Validation:** Add contact form with validation
3. **Google Maps:** Embed map for location
4. **Menu PDF:** Downloadable full menu
5. **Online Reservations:** Booking system
6. **Social Media:** Instagram feed integration
7. **Reviews:** Customer testimonials section
8. **Multi-language:** English/Indonesian toggle
9. **Dark Mode:** Theme switcher
10. **Analytics:** Google Analytics integration

### How to Add New Sections:

1. Create component in `src/components/`
2. Add comprehensive JSDoc comments
3. Import in `src/App.tsx`
4. Add to render tree
5. Update navigation links in Navbar

## ðŸ› Common Issues & Solutions

### Issue: Build fails with PostCSS error

**Solution:** Ensure `postcss.config.cjs` (not .ts) exists

### Issue: Images not loading

**Solution:** Check image URLs are valid and accessible

### Issue: TypeScript errors

**Solution:** Run `npm run typecheck` and fix type issues

### Issue: Styles not applying

**Solution:**

1. Check Tailwind classes are correct
2. Ensure `index.css` imports Tailwind directives
3. Rebuild: `npm run build`

## ðŸ“ Code Standards

### Component Structure

```typescript
/**
 * Component Name
 *
 * Purpose: Brief description
 *
 * Features:
 * - Feature 1
 * - Feature 2
 *
 * For Future AI Agents:
 * - Important notes
 * - Modification guidelines
 */

import { ... } from '...'

const ComponentName = () => {
  // State and logic

  return (
    // JSX
  )
}

export default ComponentName
```

### Naming Conventions

- **Components:** PascalCase (e.g., `Navbar.tsx`)
- **Functions:** camelCase (e.g., `handleClick`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_ITEMS`)
- **Interfaces:** PascalCase (e.g., `MenuItem`)
- **CSS Classes:** kebab-case (Tailwind)

## ðŸ” Best Practices

1. **Always add JSDoc comments** to components
2. **Use TypeScript types** for all props and state
3. **Follow responsive-first** approach (mobile â†’ desktop)
4. **Optimize images** before adding to production
5. **Test on multiple devices** (mobile, tablet, desktop)
6. **Run quality checks** before committing:
   ```bash
   npm run typecheck && npm run lint && npm run format
   ```
7. **Keep components small** and focused (Single Responsibility)
8. **Extract reusable logic** into custom hooks
9. **Use semantic HTML** for accessibility
10. **Add alt text** to all images

## ðŸ“ž Contact & Support

**Restaurant Contact:**

- WhatsApp: 0811-1658-033
- Location: Bandung, West Java, Indonesia

**Development Notes:**

- Built: November 2025
- Developer: AI Agent (E1)
- Framework: React 18 + TypeScript + Vite

---

## ðŸ¤– Notes for Future AI Agents

### This codebase was built with you in mind!

Every file includes:

- **JSDoc comments** explaining purpose and usage
- **Type definitions** for all data structures
- **Clear component structure** following React best practices
- **Comprehensive documentation** in this README

### When modifying this code:

1. **Read component comments first** - they explain the "why" not just the "what"
2. **Maintain type safety** - TypeScript will guide you
3. **Run quality checks** after changes
4. **Update documentation** if you add features
5. **Keep the same code style** (Prettier will help)

### Key Files to Understand:

1. `src/App.tsx` - Application structure
2. `src/types.ts` - Data models
3. `src/*.json` - Content (menu/gallery/contact)
4. Component files - UI implementation

### Logging for Debugging:

```typescript
// Use console.log with descriptive messages
console.log('[ComponentName] State updated:', newState)
console.error('[ComponentName] Error occurred:', error)
```

**Good luck with your enhancements! ðŸš€**
