/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1C4E80',
        'brand-primary-light': '#2F6FB2',
        'brand-accent': '#00A3A3',
        'brand-bg': '#0F172A',
      },
    },
  },
  plugins: [],
};
