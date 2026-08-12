import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#0f0f13",
        surface: "#1a1a20",
        "surface-2": "#232329",
        line: "#2e2e36",
        fg: "#f5f5f7",
        "fg-2": "#9a9aa3",
        accent: "#fe2c55",
        cyan: "#22d3ee",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      boxShadow: {
        subtle: "0 1px 2px rgb(0 0 0 / .4)",
        card: "0 4px 20px rgb(0 0 0 / .5)",
        lg: "0 8px 30px rgb(0 0 0 / .55)",
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
