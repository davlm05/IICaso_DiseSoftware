/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Tokens are defined once in src/styles/global.css (:root) and referenced
      // here via var(). See README.md#branding--style-guidelines.
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        error: "var(--color-error)",
        success: "var(--color-success)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
      },
      fontFamily: {
        display: ["Poppins_700Bold"],
        heading: ["Poppins_600SemiBold"],
        body: ["Inter_400Regular"],
        caption: ["Inter_400Regular"],
      },
      fontSize: {
        display: "var(--font-display)",
        subheading: "var(--font-subheading)",
        body: "var(--font-body)",
        button: "var(--font-button)",
        caption: "var(--font-caption)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
      },
    },
  },
  plugins: [],
};
