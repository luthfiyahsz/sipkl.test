import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4fb",
          100: "#d8e6f6",
          200: "#b3cdec",
          300: "#83abdd",
          400: "#4f83c9",
          500: "#2f64ab",
          600: "#234f8d",
          700: "#1e3a5f",
          800: "#182f4d",
          900: "#14273f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "Tahoma", "Verdana", "sans-serif"],
      },
      boxShadow: {
        card: "0 0.125rem 0.35rem rgba(18, 38, 63, 0.08)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
