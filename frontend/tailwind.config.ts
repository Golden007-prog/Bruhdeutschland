import type { Config } from "tailwindcss";

// shadcn/ui-style theme tokens mapped to CSS variables (see src/index.css).
const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Feature-category accent colors (6 categories — feature-matrix.md).
        category: {
          profile: "hsl(var(--cat-profile))",
          documents: "hsl(var(--cat-documents))",
          language: "hsl(var(--cat-language))",
          finance: "hsl(var(--cat-finance))",
          visa: "hsl(var(--cat-visa))",
          campus: "hsl(var(--cat-campus))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
