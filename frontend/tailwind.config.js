/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        dark: {
          950: "#070C09", // Deepest background
          900: "#0A120D", // Primary background
          850: "#0E1812", // Card / Panel dark
          800: "#132118", // Elevated surface
          750: "#182A1F", // Interactive hover surface
          700: "#1E3527", // Subtle borders
          600: "#274835",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(16, 185, 129, 0.25)",
        "glow-md": "0 0 25px -5px rgba(16, 185, 129, 0.35)",
        "glow-lg": "0 0 35px -5px rgba(16, 185, 129, 0.45)",
      },
    },
  },
  plugins: [],
};
