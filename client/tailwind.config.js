/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      borderRadius: {
        card: "12px",
        button: "8px",
      },
      colors: {
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        background: "#F8FAFC",
        surface: "#FFFFFF",
        status: {
          live: {
            50: "#ECFDF5",
            100: "#D1FAE5",
            500: "#10B981",
            600: "#059669",
            700: "#047857",
          },
          queue: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
          },
          error: {
            50: "#FFF1F2",
            100: "#FFE4E6",
            500: "#F43F5E",
            600: "#E11D48",
            700: "#BE123C",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};