/**
 * Tailwind CSS Configuration for Warung Meng
 *
 * AI AGENT NOTES:
 * - Custom color palette matches the restaurant branding
 * - Colors: cream (bg), gold (accent), orange (primary), brown (text)
 * - Mobile-first responsive design approach
 * - Extended with custom spacing and animations
 *
 * Color Usage Guide:
 * - cream (#F6F1E9): Main background, light sections
 * - gold (#FFD93D): Accent elements, highlights, badges
 * - orange (#FF9A00): Primary buttons, CTAs, active states
 * - brown (#4F200D): Text, dark elements, headers
 *
 * When modifying:
 * - Keep color consistency with brand identity
 * - Test contrast ratios for accessibility (WCAG AA minimum)
 * - Don't remove default Tailwind utilities
 */
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F6F1E9",
        gold: "#FFD93D",
        orange: "#FF9A00",
        brown: "#4F200D",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
