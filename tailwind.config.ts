import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // pulled from the elellaan logo
        brand: {
          50:  "#FAF6FA",
          100: "#F1E9F1",
          200: "#E2D2E4",
          300: "#CDB3D1",
          400: "#B493BB",
          500: "#9B7BA0",
          600: "#82627F",
          700: "#684E63",
          800: "#4D3949",
          900: "#33252F",
        },
        ink: {
          DEFAULT: "#1D1D1F",
          soft:   "#3A3A3C",
          muted:  "#86868B",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          glass:   "rgba(255,255,255,0.72)",
          subtle:  "#F5F2F6",
        },
      },
      fontFamily: {
        sans: [
          '-apple-system','BlinkMacSystemFont','"SF Pro Display"','"SF Pro Text"',
          '"Segoe UI"','Roboto','"Helvetica Neue"','Arial','sans-serif',
        ],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(155, 123, 160, 0.12), 0 1px 0 rgba(255,255,255,0.7) inset",
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(155,123,160,0.08)",
        pop:  "0 12px 40px rgba(155,123,160,0.25)",
      },
      borderRadius: {
        apple: "1.25rem",
      },
      backdropBlur: {
        xs: "6px",
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
        "tick-pop": "tickPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "logo-float": "logoFloat 5.5s ease-in-out infinite",
        "logo-glow":  "logoGlow 4s ease-in-out infinite",
        "logo-entrance": "logoEntrance 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "shimmer":   "shimmer 2.4s linear infinite",
        "row-press": "rowPress 0.18s ease-out",
        "stagger-1": "fadeUp 0.5s 0.05s cubic-bezier(0.22, 1, 0.36, 1) both",
        "stagger-2": "fadeUp 0.5s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both",
        "stagger-3": "fadeUp 0.5s 0.20s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        tickPop: {
          "0%":  { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.18)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        logoFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        logoGlow: {
          "0%, 100%": { filter: "drop-shadow(0 8px 22px rgba(155,123,160,0.18))" },
          "50%":      { filter: "drop-shadow(0 14px 32px rgba(155,123,160,0.36))" },
        },
        logoEntrance: {
          "0%":   { opacity: "0", transform: "scale(0.7) rotate(-6deg)" },
          "60%":  { opacity: "1", transform: "scale(1.05) rotate(2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        rowPress: {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(0.985)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
