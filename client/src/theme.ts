/**
 * Konsistentes Theme für die gesamte Anwendung
 * Schwarz-Weiß Design
 */

export const theme = {
  colors: {
    lightBlue: "#f5f5f5",
    blue: "#000000",
    darkBlue: "#000000",
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
    white: "#ffffff",
    black: "#000000",
    gray: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },
  },
  shadows: {
    sm: `0 2px 8px rgba(0, 0, 0, 0.05)`,
    md: `0 4px 12px rgba(0, 0, 0, 0.08)`,
    lg: `0 8px 24px rgba(0, 0, 0, 0.1)`,
    xl: `0 12px 40px rgba(0, 0, 0, 0.12)`,
  },
  borderRadius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
  },
} as const;
