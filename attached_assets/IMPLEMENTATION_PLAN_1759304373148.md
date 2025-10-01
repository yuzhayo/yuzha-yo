# Nested Accordion Implementation Plan for ConfigYuzhaPopup

## 🎯 Objective

Implement a 3-level nested accordion system inside ConfigYuzhaPopup body that is fully scrollable and responsive to popup resize.

---

## 📋 Requirements Summary

### Visual Structure

```
PARENT 1 (Level 1)
├── Sub Parent 1 (Level 2)
│   ├── Child 1 (Level 3)
│   └── Child 2 (Level 3)
└── Sub Parent 2 (Level 2)
    ├── Child 3 (Level 3)
    └── Child 4 (Level 3)

PARENT 2 (Level 1)
├── Sub Parent 1 (Level 2)
│   ├── Child 5 (Level 3)
│   └── Child 6 (Level 3)
└── Sub Parent 2 (Level 2)
    ├── Child 7 (Level 3)
    └── Child 8 (Level 3)
```

### Key Features

- ✅ 3-level hierarchy (Parent → Sub Parent → Children)
- ✅ Full-width bars that fill container
- ✅ Expand/collapse functionality
- ✅ **Scrollable when content is long**
- ✅ **Responsive to popup resize**
- ✅ Visual differentiation between levels (colors, indentation)
- ✅ Smooth animations

---

## 🛠️ Technology Stack

### Library: Radix UI Accordion

- **Why?** Production-ready, accessible, supports nesting, unstyled (full Tailwind control)
- **Package:** `@radix-ui/react-accordion`
- **Docs:** https://www.radix-ui.com/docs/primitives/components/accordion

### Optional: Tailwind Scrollbar Plugin

- **Package:** `tailwind-scrollbar`
- **Purpose:** Custom scrollbar styling
- **Alternative:** Use native CSS scrollbar styling

---

## 📦 Installation Steps

### Step 1: Install Radix UI Accordion

```bash
cd /app/frontend
yarn add @radix-ui/react-accordion
```

### Step 2: Install Tailwind Scrollbar (Optional)

```bash
yarn add tailwind-scrollbar
```

### Step 3: Configure Tailwind (if using scrollbar plugin)

Edit `/app/frontend/tailwind.config.js`:

```javascript
module.exports = {
  // ... existing config
  plugins: [require("tailwind-scrollbar")({ nocompatible: true })],
};
```

---

## 🏗️ File Structure

### Files to Modify

1. `/app/shared/config/ConfigYuzhaPopup.tsx` - Add accordion content
2. `/app/yuzha/src/MainScreenUtils.tsx` - Pass accordion data to popup

### New File to Create (Optional)

- `/app/shared/config/AccordionContent.tsx` - Separate component for accordion logic

---

## 💻 Implementation Steps

### Step 1: Create Data Structure

Create sample data structure for accordion:

```typescript
interface AccordionItem {
  id: string;
  label: string;
  level: 1 | 2 | 3;
  children?: AccordionItem[];
}

const accordionData: AccordionItem[] = [
  {
    id: "parent-1",
    label: "PARENT 1",
    level: 1,
    children: [
      {
        id: "parent-1-sub-1",
        label: "Sub Parent 1",
        level: 2,
        children: [
          { id: "child-1", label: "Child 1", level: 3 },
          { id: "child-2", label: "Child 2", level: 3 },
        ],
      },
      {
        id: "parent-1-sub-2",
        label: "Sub Parent 2",
        level: 2,
        children: [
          { id: "child-3", label: "Child 3", level: 3 },
          { id: "child-4", label: "Child 4", level: 3 },
        ],
      },
    ],
  },
  {
    id: "parent-2",
    label: "PARENT 2",
    level: 1,
    children: [
      {
        id: "parent-2-sub-1",
        label: "Sub Parent 1",
        level: 2,
        children: [
          { id: "child-5", label: "Child 5", level: 3 },
          { id: "child-6", label: "Child 6", level: 3 },
        ],
      },
      {
        id: "parent-2-sub-2",
        label: "Sub Parent 2",
        level: 2,
        children: [
          { id: "child-7", label: "Child 7", level: 3 },
          { id: "child-8", label: "Child 8", level: 3 },
        ],
      },
    ],
  },
];
```

---

### Step 2: Modify renderBody Function

**File:** `/app/shared/config/ConfigYuzhaPopup.tsx`

**Current code (lines 234-238):**

```typescript
const renderBody = () => (
  <div className="p-5 bg-gray-200 flex flex-col items-center justify-center gap-5" style={{ height: "calc(100% - 48px)" }}>
    {children ?? null}
  </div>
);
```

**Replace with:**

```typescript
const renderBody = () => (
  <div
    className="relative bg-gray-100"
    style={{ height: "calc(100% - 48px)" }}
  >
    {/* Scrollable Container */}
    <div
      className="
        w-full h-full
        overflow-y-auto
        overflow-x-hidden
        scroll-smooth
        scrollbar-thin
        scrollbar-thumb-blue-500
        scrollbar-track-gray-200
      "
    >
      {/* Content Area */}
      <div className="p-2">
        {children ?? null}
      </div>
    </div>
  </div>
);
```

**Key Changes:**

- Removed `flex items-center justify-center` (no longer centering)
- Added scrollable wrapper with `overflow-y-auto`
- Added custom scrollbar classes
- Reduced padding from `p-5` to `p-2` for more content space

---

### Step 3: Create Nested Accordion Component

**Create new file:** `/app/shared/config/AccordionContent.tsx`

```typescript
import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons"; // or use custom icon

interface AccordionItem {
  id: string;
  label: string;
  level: 1 | 2 | 3;
  children?: AccordionItem[];
}

interface NestedAccordionProps {
  data: AccordionItem[];
  level?: 1 | 2 | 3;
}

// Style configurations for each level
const getLevelStyles = (level: number) => {
  const styles = {
    1: {
      trigger: "bg-blue-500 text-white font-semibold text-base px-4 py-3 border-l-4 border-blue-700",
      content: "bg-blue-50",
    },
    2: {
      trigger: "bg-blue-300 text-gray-900 font-medium text-sm px-6 py-2.5 border-l-3 border-blue-500 ml-2",
      content: "bg-blue-25",
    },
    3: {
      trigger: "bg-gray-100 text-gray-700 font-normal text-xs px-8 py-2 border-l-2 border-gray-400 ml-4",
      content: "bg-white",
    },
  };
  return styles[level as keyof typeof styles] || styles[1];
};

export function NestedAccordion({ data, level = 1 }: NestedAccordionProps) {
  const styles = getLevelStyles(level);

  return (
    <Accordion.Root type="multiple" className="w-full space-y-1">
      {data.map((item) => (
        <Accordion.Item key={item.id} value={item.id} className="overflow-hidden">
          {/* Trigger (Clickable Header) */}
          <Accordion.Trigger
            className={`
              ${styles.trigger}
              w-full
              flex items-center justify-between
              hover:opacity-90
              transition-all duration-200
              group
            `}
          >
            <span>{item.label}</span>
            <ChevronDownIcon
              className="
                transition-transform duration-300 ease-in-out
                group-data-[state=open]:rotate-180
              "
              aria-hidden
            />
          </Accordion.Trigger>

          {/* Content (Expandable Area) */}
          {item.children && item.children.length > 0 && (
            <Accordion.Content
              className={`
                ${styles.content}
                overflow-hidden
                data-[state=open]:animate-slideDown
                data-[state=closed]:animate-slideUp
              `}
            >
              <div className="py-2">
                {/* Recursive call for nested items */}
                {level < 3 ? (
                  <NestedAccordion data={item.children} level={(level + 1) as 1 | 2 | 3} />
                ) : (
                  // Level 3 (Children) - Just display as list
                  <div className="space-y-1">
                    {item.children.map((child) => (
                      <div
                        key={child.id}
                        className="bg-white px-10 py-2 text-xs text-gray-600 ml-6 border-l-2 border-gray-300"
                      >
                        • {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Accordion.Content>
          )}
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

// Sample data export
export const sampleAccordionData: AccordionItem[] = [
  {
    id: "parent-1",
    label: "PARENT 1",
    level: 1,
    children: [
      {
        id: "parent-1-sub-1",
        label: "Sub Parent 1",
        level: 2,
        children: [
          { id: "child-1", label: "Child 1", level: 3 },
          { id: "child-2", label: "Child 2", level: 3 },
        ],
      },
      {
        id: "parent-1-sub-2",
        label: "Sub Parent 2",
        level: 2,
        children: [
          { id: "child-3", label: "Child 3", level: 3 },
          { id: "child-4", label: "Child 4", level: 3 },
        ],
      },
    ],
  },
  {
    id: "parent-2",
    label: "PARENT 2",
    level: 1,
    children: [
      {
        id: "parent-2-sub-1",
        label: "Sub Parent 1",
        level: 2,
        children: [
          { id: "child-5", label: "Child 5", level: 3 },
          { id: "child-6", label: "Child 6", level: 3 },
        ],
      },
      {
        id: "parent-2-sub-2",
        label: "Sub Parent 2",
        level: 2,
        children: [
          { id: "child-7", label: "Child 7", level: 3 },
          { id: "child-8", label: "Child 8", level: 3 },
        ],
      },
    ],
  },
];
```

---

### Step 4: Add Animations to Tailwind Config

**File:** `/app/frontend/tailwind.config.js`

Add custom animations for smooth expand/collapse:

```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        slideDown: {
          from: { height: 0, opacity: 0 },
          to: { height: "var(--radix-accordion-content-height)", opacity: 1 },
        },
        slideUp: {
          from: { height: "var(--radix-accordion-content-height)", opacity: 1 },
          to: { height: 0, opacity: 0 },
        },
      },
      animation: {
        slideDown: "slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)",
        slideUp: "slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")({ nocompatible: true })],
};
```

---

### Step 5: Use Accordion in ConfigYuzhaPopup

**File:** `/app/yuzha/src/MainScreenUtils.tsx`

**Find line 456 (current usage):**

```typescript
<ConfigYuzhaPopup isOpen={isConfigOpen} onClose={handleClosePopup} />
```

**Replace with:**

```typescript
import { NestedAccordion, sampleAccordionData } from "@shared/config/AccordionContent";

// ... inside component

<ConfigYuzhaPopup isOpen={isConfigOpen} onClose={handleClosePopup} title="Configuration">
  <NestedAccordion data={sampleAccordionData} />
</ConfigYuzhaPopup>
```

---

## 🎨 Styling Guide

### Level Differentiation

| Level              | Background    | Text Size   | Font Weight     | Padding       | Border                       |
| ------------------ | ------------- | ----------- | --------------- | ------------- | ---------------------------- |
| **1 (Parent)**     | `bg-blue-500` | `text-base` | `font-semibold` | `px-4 py-3`   | `border-l-4 border-blue-700` |
| **2 (Sub Parent)** | `bg-blue-300` | `text-sm`   | `font-medium`   | `px-6 py-2.5` | `border-l-3 border-blue-500` |
| **3 (Children)**   | `bg-gray-100` | `text-xs`   | `font-normal`   | `px-8 py-2`   | `border-l-2 border-gray-400` |

### Indentation

- Level 1: No margin
- Level 2: `ml-2` (8px)
- Level 3: `ml-4` (16px)

### Hover Effects

- All triggers: `hover:opacity-90`
- Smooth transition: `transition-all duration-200`

---

## 📱 Responsive Behavior

### Scrollable Container

```typescript
// Body height calculation
height: calc(100% - 48px)  // 48px = header height

// Scrollable wrapper
overflow-y: auto           // Vertical scroll when needed
overflow-x: hidden         // No horizontal scroll
scroll-smooth              // Smooth scrolling behavior
```

### Resize Handling

- Popup width changes → Accordion width auto-adjusts (100% of container)
- Popup height changes → Scroll area height auto-adjusts
- Content always fills container width
- Scrollbar appears only when content height > container height

---

## 🔧 Custom Scrollbar (Optional)

### With tailwind-scrollbar plugin:

```typescript
className="
  scrollbar-thin              // 8px width
  scrollbar-thumb-blue-500    // Scrollbar handle color
  scrollbar-track-gray-200    // Scrollbar track color
"
```

### With native CSS (if not using plugin):

Add to `/app/frontend/src/App.css`:

```css
.accordion-scroll::-webkit-scrollbar {
  width: 8px;
}

.accordion-scroll::-webkit-scrollbar-track {
  background: #e5e7eb; /* gray-200 */
  border-radius: 10px;
}

.accordion-scroll::-webkit-scrollbar-thumb {
  background: #3b82f6; /* blue-500 */
  border-radius: 10px;
}

.accordion-scroll::-webkit-scrollbar-thumb:hover {
  background: #2563eb; /* blue-600 */
}
```

Then add class to scrollable div:

```typescript
<div className="accordion-scroll overflow-y-auto ...">
```

---

## ✅ Testing Checklist

### Functionality Tests

- [ ] Level 1 (Parent) items can expand/collapse
- [ ] Level 2 (Sub Parent) items can expand/collapse independently
- [ ] Level 3 (Children) display correctly
- [ ] Multiple items can be expanded simultaneously
- [ ] Clicking expanded item collapses it

### Visual Tests

- [ ] Level 1 has blue-500 background
- [ ] Level 2 has blue-300 background
- [ ] Level 3 has gray-100 background
- [ ] Indentation increases with each level
- [ ] Chevron icon rotates on expand/collapse
- [ ] Animations are smooth (300ms)

### Scrolling Tests

- [ ] Scroll appears when content is long
- [ ] Scroll works smoothly
- [ ] Header stays fixed (doesn't scroll)
- [ ] Content scrolls within body area only
- [ ] Scrollbar is styled (thin, colored)

### Responsive Tests

- [ ] Accordion fills popup width
- [ ] Resizing popup width → accordion adjusts
- [ ] Resizing popup height → scroll area adjusts
- [ ] No horizontal overflow
- [ ] Works on different popup sizes (small, medium, large)

---

## 🚨 Common Issues & Solutions

### Issue 1: Scrollbar not showing

**Solution:** Check if content height > container height. Add more items to test.

### Issue 2: Accordion not nested properly

**Solution:** Verify `level` prop is passed correctly in recursive calls.

### Issue 3: Animations not working

**Solution:** Ensure Tailwind config has the custom animations added.

### Issue 4: Content overflow horizontally

**Solution:** Add `overflow-x-hidden` to scrollable container.

### Issue 5: Header scrolls with content

**Solution:** Check `renderBody` height calculation: `calc(100% - 48px)`

---

## 📚 API Reference

### Radix Accordion Components

#### `<Accordion.Root>`

- `type`: `"single"` | `"multiple"` - Control expand behavior
- `collapsible`: `boolean` - Allow closing open items
- `defaultValue`: `string | string[]` - Default open items

#### `<Accordion.Item>`

- `value`: `string` - Unique identifier (required)

#### `<Accordion.Trigger>`

- Auto-handles click events
- `data-state`: `"open"` | `"closed"` - For styling

#### `<Accordion.Content>`

- Auto-animates expand/collapse
- `data-state`: `"open"` | `"closed"` - For styling

---

## 🎯 Next Steps After Implementation

1. **Test all functionality** using checklist above
2. **Adjust colors** if needed (change `bg-blue-*` classes)
3. **Add real content** - Replace sample data with actual configuration options
4. **Add icons** - Use custom icons for different item types
5. **Implement search** - Add search bar to filter accordion items (optional)
6. **Add tooltips** - Show descriptions on hover (optional)

---

## 📝 Notes for AI Agent

- All file paths are absolute from `/app`
- Use `yarn` for package installation (NOT npm)
- Preserve existing code in ConfigYuzhaPopup (drag/resize functionality)
- Only modify `renderBody` function and add children prop usage
- Test after each major change
- Restart frontend if needed: `sudo supervisorctl restart frontend`
- Check for errors in browser console
- Verify imports are correct (especially `@shared/config/...` path alias)

---

## 🔗 Resources

- Radix UI Accordion Docs: https://www.radix-ui.com/docs/primitives/components/accordion
- Tailwind Scrollbar Plugin: https://github.com/adoxography/tailwind-scrollbar
- Tailwind CSS Docs: https://tailwindcss.com/docs

---

**END OF IMPLEMENTATION PLAN**
