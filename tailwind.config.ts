import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B0F17",
          surface: "#0F172A",
          card: "#131B2E",
          hover: "#1A253D",
          border: "#1E293B",
          borderSubtle: "#27354F",
          text: "#F8FAFC",
          muted: "#94A3B8",
          dimmed: "#64748B",
        },
        brand: {
          emerald: "#10B981",
          emeraldLight: "#34D399",
          emeraldDark: "#059669",
          cyan: "#06B6D4",
          violet: "#6366F1",
          rose: "#EF4444",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
        "radial-cyan": "radial-gradient(circle at 50% 100%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)",
        "mesh-pattern": "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
