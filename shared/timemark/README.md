# Timemark Assets

Exported assets from Timemark app for reuse across workspaces.

## Structure

```
shared/timemark/
├── fonts/           # 11 TTF/OTF font files
├── templates/       # Watermark template definitions (JSON)
├── logos/           # Express delivery service logos
├── examples/        # Reference screenshots showing layouts
├── types.ts         # TypeScript definitions
└── README.md
```

## Fonts (11)

| Font | Style |
|------|-------|
| BebasDaka | Display, condensed |
| BigShouldersText-Medium | Display |
| Handlee-Regular | Handwriting |
| Montserrat-Black | Sans-serif, bold |
| PTMono-Bold / Regular | Monospace |
| RobotoCondensed-Bold/Medium/Regular | Condensed sans |
| TypoDigitDemo | Digital/LCD style |
| XiaoHeiNumber | Numeric display |

## Templates

- `default_watermarks_global.json` - 15+ default templates
- `supported_watermarks_template_global.json` - Extended templates

### Template Names
- Time&Location
- Clock in
- Custom Text
- Completed
- Construction Record
- Work Report
- Project
- Service
- Location
- BigMap
- Sheet
- Cleaned
- Map
- Security Guard
- And more...

## Logos (8)

Express delivery service logos:
- Amazon, DHL, DoorDash, FedEx, Grubhub, Instacart, UberEats, UPS

## Examples (3)

Reference images showing actual Timemark output layouts.

## Usage

```typescript
import { 
  TimemarkTemplate, 
  TimemarkItem,
  TIMEMARK_ITEM_IDS,
  TIMEMARK_FONTS,
  generatePhotoCode,
  parseTimemarkTemplate
} from "shared/timemark/types";

// Generate a photo verification code
const code = generatePhotoCode(); // "EG6P1H9HLAMGPU"

// Parse a template wrapper
const template = parseTimemarkTemplate(wrapper);
```

## Item IDs Reference

| ID | Field |
|----|-------|
| 1 | Time |
| 2 | Address |
| 3 | Lat/Long |
| 4 | Weather |
| 5 | Altitude |
| 6 | Compass |
| 11 | Title |
| 12 | Notes |
| 210 | Map |
| 550 | Company |
| 620 | Business Card |
| 630 | Tags |
| 640 | Photo Code |

## Theme Colors

Default theme: `#FFC233` (orange/yellow) with `#FFFFFF` text
