/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hush: {
          black: "#111827",
          sky: "#0EA5E9",
          "sky-dark": "#0284C7",
          orange: "#F97316",
          "orange-dark": "#EA580C",
          pink: "#EC4899",
          "pink-dark": "#DB2777",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E5E7EB",
          subtle: "#F1F5F9",
          muted: "#64748B",
        }
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        popover: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      }
    },
  },
  plugins: [],
}

