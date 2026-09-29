import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // The neutral scale every component already uses, re-tuned warm so
        // surfaces read as paper and charcoal rather than blue-gray.
        slate: {
          50: "#F8F7F4",
          100: "#F1EFEB",
          200: "#E4E1DB",
          300: "#CFCAC2",
          400: "#A19C93",
          500: "#78736B",
          600: "#5A5650",
          700: "#42403B",
          800: "#2A2926",
          900: "#1B1A18",
          950: "#121110",
        },
        "brand-primary": "#1C4E80",
        "brand-primary-light": "#2F6FB2",
        "brand-secondary": "#163E66",
        "brand-accent": "#00A3A3",
        "brand-bg": "#1B1A18",
        // One warm signal colour, reserved for "new" and needs-attention states.
        signal: {
          DEFAULT: "#D9480F",
          soft: "#FDEBDD",
          ink: "#8A2E08",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-display)", "var(--font-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
