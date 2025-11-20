# System Architecture - Plantation Cafe Resto Website

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                    │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │         React Application (SPA)                │    │
│  │                                                │    │
│  │  ├── Navbar (Fixed)                            │    │
│  │  ├── Hero Section                              │    │
│  │  ├── About Section                             │    │
│  │  ├── Menu Section                              │    │
│  │  ├── Gallery Section                           │    │
│  │  ├── Contact Section                           │    │
│  │  └── Footer                                     │    │
│  │                                                │    │
│  │  State: useState, props, component state       │    │
│  │  Styling: Tailwind CSS utilities              │    │
│  │  Icons: Lucide React                           │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                   Static Hosting
                  (Vite Build Output)
```

## 📦 Component Hierarchy

```
App.tsx (Root)
├── Navbar.tsx
│   └── useState(isMenuOpen)
├── Hero.tsx
├── About.tsx
├── Menu.tsx
│   └── Data: menuItems.ts
├── Gallery.tsx
│   └── Data: galleryItems.ts
├── Contact.tsx
└── Footer.tsx
```

## 🔄 Data Flow

### Static Data Pattern (Current)
```
Data Files (TypeScript)
    ↓
menuItems.ts, galleryItems.ts
    ↓
Imported by Components
    ↓
Rendered in JSX
    ↓
Displayed in Browser
```

### State Management
- **Local State:** `useState` for component-specific state (e.g., mobile menu)
- **No Global State:** Not needed for current static site
- **Future:** Consider Context API or Zustand for complex state

## 🎨 Styling Architecture

### Tailwind CSS Approach
```
Tailwind Config (tailwind.config.ts)
    ↓
Custom Theme (colors, fonts, animations)
    ↓
Global Styles (index.css)
    ↓
Component Classes (inline Tailwind)
    ↓
Purged CSS (production)
```

### CSS Layers
1. **Base Layer:** CSS resets, HTML defaults
2. **Components Layer:** Reusable component classes
3. **Utilities Layer:** Tailwind utility classes

## 🏗️ Build Process

```
Source Code (TypeScript + React)
    ↓
TypeScript Compilation (tsc)
    ↓
Vite Bundling
    ├── Code Splitting
    ├── Tree Shaking
    ├── Minification
    └── Asset Optimization
    ↓
Optimized Bundle (dist/)
    ├── index.html
    ├── assets/index-[hash].js
    └── assets/index-[hash].css
```

## 📱 Responsive Design Strategy

### Mobile-First Approach
```
Base Styles (Mobile)
    ↓
Tablet Styles (@media min-width: 768px)
    ↓
Desktop Styles (@media min-width: 1024px)
    ↓
Large Desktop (@media min-width: 1280px)
```

### Breakpoint Usage
- **Default:** Mobile (< 640px)
- **sm:** Small tablets (640px+)
- **md:** Tablets (768px+)
- **lg:** Desktops (1024px+)
- **xl:** Large desktops (1280px+)

## 🔌 Integration Points

### Current Integrations
1. **WhatsApp:** Deep link for contact (`wa.me` URL)
2. **Unsplash/Pexels:** External image hosting
3. **Google Fonts:** Web fonts (Poppins, Inter)

### Future Integration Opportunities
1. **Backend API:** Menu management, reservations
2. **CMS:** WordPress, Strapi, or headless CMS
3. **Payment Gateway:** Online orders
4. **Analytics:** Google Analytics, Mixpanel
5. **Social Media:** Instagram API
6. **Maps:** Google Maps API
7. **Email:** Contact form backend

## 🚀 Performance Optimization

### Current Optimizations
1. **Code Splitting:** Vite automatic chunks
2. **Tree Shaking:** Remove unused code
3. **Minification:** CSS and JS minified
4. **Image Optimization:** WebP format from Unsplash
5. **Lazy Loading:** Images load as needed
6. **CSS Purging:** Tailwind removes unused classes

### Recommended Future Optimizations
1. **Image CDN:** Cloudinary, Imgix
2. **Service Worker:** Offline support (PWA)
3. **Bundle Analysis:** webpack-bundle-analyzer
4. **Preloading:** Critical resources
5. **Compression:** Gzip/Brotli on server

## 🔒 Security Considerations

### Current Security
- **No Backend:** Reduces attack surface
- **Static Hosting:** Inherently secure
- **External Links:** Use `rel="noopener noreferrer"`
- **TypeScript:** Type safety prevents runtime errors

### Future Security Considerations
1. **Content Security Policy (CSP)**
2. **HTTPS:** Enforce SSL
3. **Input Validation:** When adding forms
4. **Rate Limiting:** For API calls
5. **Authentication:** If adding admin panel

## 📊 Monitoring & Analytics

### Recommended Tracking
```typescript
// Example: Track menu item clicks
const handleMenuClick = (itemId: string) => {
  // Analytics event
  console.log('[Analytics] Menu item clicked:', itemId)
  // gtag('event', 'menu_click', { item_id: itemId })
}
```

### Key Metrics to Track
1. **Page Views:** Overall traffic
2. **Scroll Depth:** User engagement
3. **Button Clicks:** CTA effectiveness
4. **WhatsApp Clicks:** Contact conversions
5. **Gallery Interactions:** Image views
6. **Menu Views:** Popular items

## 🧪 Testing Strategy

### Current Quality Checks
1. **TypeScript:** Compile-time type checking
2. **ESLint:** Code quality and best practices
3. **Prettier:** Code formatting consistency
4. **Manual Testing:** Visual inspection

### Recommended Testing Additions
```typescript
// Unit Tests (Jest + React Testing Library)
import { render, screen } from '@testing-library/react'
import Navbar from './Navbar'

test('renders navigation links', () => {
  render(<Navbar />)
  expect(screen.getByText('Home')).toBeInTheDocument()
})

// E2E Tests (Playwright/Cypress)
test('user can navigate to menu section', async () => {
  await page.click('a[href="#menu"]')
  await expect(page.locator('#menu')).toBeVisible()
})
```

## 🔧 Development Workflow

```
1. Install Dependencies
   npm install
   ↓
2. Start Dev Server
   npm run dev
   ↓
3. Make Changes
   Edit source files
   ↓
4. Hot Reload
   Vite automatically updates browser
   ↓
5. Type Check
   npm run typecheck
   ↓
6. Lint & Format
   npm run lint && npm run format
   ↓
7. Build Production
   npm run build
   ↓
8. Test Build
   npm run preview
   ↓
9. Deploy
   Upload dist/ to hosting
```

## 📂 File Organization Principles

### Component Files
- One component per file
- File name matches component name
- Co-locate related files (if needed)

### Data Files
- Separate from components
- Export typed arrays/objects
- Easy to update without touching UI

### Type Files
- Centralized in `types/`
- Reusable across components
- Export all interfaces

## 🌐 Deployment Architecture

### Static Hosting Options
```
Vercel (Recommended)
├── Automatic deployments
├── CDN distribution
├── Custom domains
└── Analytics included

Netlify
├── Drag-and-drop deployment
├── Form handling
└── Serverless functions

GitHub Pages
├── Free hosting
├── Git-based workflow
└── Custom domain support
```

### Deployment Process
```bash
# 1. Build production bundle
npm run build

# 2. Output in dist/
# 3. Upload dist/ to hosting
# 4. Configure domain (optional)
```

## 🔄 Future Architecture Evolution

### Phase 1: Static Site (Current)
- Pure frontend
- No backend
- Static data

### Phase 2: Dynamic Content
```
Frontend (React)
    ↓
API Layer (REST/GraphQL)
    ↓
Backend (Node.js/Python)
    ↓
Database (PostgreSQL/MongoDB)
```

### Phase 3: Full-Stack Application
```
Frontend (React + TypeScript)
    ↓
API Gateway
    ↓
Microservices
├── Menu Service
├── Reservation Service
├── Order Service
└── User Service
    ↓
Databases (SQL + NoSQL)
```

## 📝 Architecture Decision Records

### Why React?
- Component-based architecture
- Large ecosystem
- Fast with Virtual DOM
- TypeScript support

### Why Vite?
- Fastest build tool
- Superior DX (Developer Experience)
- Built-in optimizations
- Modern ESM support

### Why Tailwind CSS?
- Utility-first approach
- No CSS file bloat
- Consistent design system
- Rapid development

### Why Single Page Application (SPA)?
- Small site (7 sections)
- No need for routing
- Simple deployment
- Fast navigation

---

## 🤖 For Future AI Agents

This architecture document explains:
- **Why** decisions were made
- **How** components connect
- **Where** to make changes
- **What** to consider for scaling

When modifying:
1. Understand current architecture first
2. Consider impact on other components
3. Maintain separation of concerns
4. Update documentation after changes

**Architecture is a living document - update as system evolves!**
