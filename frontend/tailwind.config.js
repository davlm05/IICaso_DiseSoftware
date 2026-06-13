/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#16A34A",
        secondary: "#15803D",
        accent: "#FACC15",
        background: "#F9FAFB",
        surface: "#FFFFFF",
        error: "#DC2626",
        success: "#22C55E",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
      },
      fontFamily: {
        display: ["Poppins_700Bold"],
        heading: ["Poppins_600SemiBold"],
        body: ["Inter_400Regular"],
        caption: ["Inter_400Regular"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
    },
  },
  plugins: [],
};
