// Tailwind configuration for shared components
// Optimized content scanning for monorepo structure

import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import lineClamp from "@tailwindcss/line-clamp";
import aspectRatio from "@tailwindcss/aspect-ratio";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./yuzha/**/*.{html,ts,tsx}",
    "./shared/**/*.{html,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [forms, typography, lineClamp, aspectRatio],
};