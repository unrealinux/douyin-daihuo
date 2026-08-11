import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#fe2c55",
      },
    },
  },
  plugins: [],
};

export default config;
