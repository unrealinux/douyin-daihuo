import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#0f0f13",
        surface: "#17171e",
        "surface-2": "#1f1f28",
        "surface-3": "#282832",
        line: "#2c2c36",
        fg: "#f5f5f7",
        "fg-2": "#9a9aa3",
        accent: "#fe2c55",
        cyan: {
          DEFAULT: "#22d3ee",
          300: "#67e8f9",
          500: "#22d3ee",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        subtle: "0 1px 2px rgb(8 8 12 / 0.5)",
        card: "0 1px 0 rgb(255 255 255 / 0.03) inset, 0 8px 24px -12px rgb(8 8 12 / 0.7)",
        cardHover:
          "0 1px 0 rgb(255 255 255 / 0.05) inset, 0 12px 32px -12px rgb(254 44 85 / 0.14), 0 8px 24px -12px rgb(8 8 12 / 0.7)",
        lg: "0 1px 0 rgb(255 255 255 / 0.04) inset, 0 24px 48px -16px rgb(8 8 12 / 0.8)",
        accent: "0 8px 24px -8px rgb(254 44 85 / 0.4)",
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-quart": "cubic-bezier(0.77, 0, 0.18, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
