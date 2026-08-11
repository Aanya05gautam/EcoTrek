/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#16a34a', // emerald-600
        forest: '#064e3b', // emerald-900
        lime: '#84cc16', // lime-500
        mint: '#ecfdf5', // emerald-50
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
