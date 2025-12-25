/**
 * Konsistentes Theme für die gesamte Anwendung
 * Hellblau/Weiß Design
 */

export const theme = {
  colors: {
    lightBlue: "#60a5fa",
    blue: "#3b82f6",
    darkBlue: "#2563eb",
    bgGradient: "linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)",
    white: "#ffffff",
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },
  shadows: {
    sm: `0 2px 8px rgba(59, 130, 246, 0.1)`,
    md: `0 4px 12px rgba(59, 130, 246, 0.2)`,
    lg: `0 8px 24px rgba(59, 130, 246, 0.3)`,
    xl: `0 12px 40px rgba(59, 130, 246, 0.3)`,
  },
  borderRadius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
  },
} as const;
