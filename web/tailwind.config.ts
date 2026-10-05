import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#07090f",
          1: "#0b0e17",
          2: "#10131f",
        },
        card: "#12151f",
        card2: "#171b28",
        border: "#232838",
        cyan: "#22d3ee",
        purple: "#a78bfa",
        blue: "#60a5fa",
        green: "#34d399",
        orange: "#fbbf24",
        red: "#f87171",
        t1: "#f3f5f9",
        t2: "#9aa3b8",
        t3: "#6b7385",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.15), 0 8px 30px rgba(34,211,238,0.08)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
    },
  },
  plugins: [],
};
export default config;
