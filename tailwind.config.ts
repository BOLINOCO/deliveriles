import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Identité visuelle Deliver'îles — entre tons naturels et couleurs ultra vibrantes
          blue: "#0EA5E9",
          "blue-bright": "#38BDF8",
          "blue-soft": "#E0F2FE",
          orange: "#F97316",
          "orange-deep": "#EA580C",
          "orange-soft": "#FFEDD5",
          navy: "#0F172A",
          surface: "#F8FAFC",
          green: "#10B981",
          "green-soft": "#D1FAE5",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      keyframes: {
        "scroll-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "scroll-left": "scroll-left 32s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
