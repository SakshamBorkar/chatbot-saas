"use client";

/**
 * Light-only theme colors.
 * The ThemeProvider and useTheme hook are kept for backward compatibility
 * but always resolve to "light".
 */

export const themeColors = {
  light: {
    bg: "#f8fafc",
    bgSecondary: "#fff",
    text: "#0f172a",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    primary: "#2563eb",
    error: "#dc2626",
    success: "#16a34a",
  },
};

/** @deprecated No-op — theme is always light. Kept for backward compat. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Always returns light theme colors. */
export function useTheme() {
  return {
    theme: "light" as const,
    resolvedTheme: "light" as const,
    setTheme: () => {},
  };
}
