import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1040px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Cormorant Garamond", "serif"],
        sanskrit: ["Cinzel", "serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Design system accent colors
        "accent-lilac": "hsl(var(--accent-lilac))",
        "accent-mint": "hsl(var(--accent-mint))",
        "accent-peach": "hsl(var(--accent-peach))",
        "accent-yellow": "hsl(var(--accent-yellow))",
        // New mystical theme colors
        "accent-teal": "var(--accent-teal)",
        "accent-coral": "var(--accent-coral)",
        "accent-gold": "var(--accent-gold)",
        "accent-sage": "var(--accent-sage)",
        // Background variants
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card": "var(--bg-card)",
        // Text variants
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        // Glass effect
        "glass-border": "var(--glass-border)",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "glow-teal": "var(--glow-teal)",
        "glow-coral": "var(--glow-coral)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "count-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(79, 209, 197, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(79, 209, 197, 0.4)" },
        },
        "progress-ring": {
          from: { strokeDashoffset: "283" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "fade-in-scale": "fade-in-scale 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "count-up": "count-up 0.5s ease-out forwards",
        "pop": "pop 0.2s ease-out",
        "shimmer": "shimmer 2s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "progress-ring": "progress-ring 1s ease-out forwards",
      },
      fontSize: {
        "display": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "heading": ["24px", { lineHeight: "1.25", fontWeight: "700" }],
        "subheading": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        "body": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "caption": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
