import { lightTheme } from "../theme/colors";

// Legacy theme export to keep old screens working without rewriting imports
export const theme = {
    colors: {
        ...lightTheme,
        // Map legacy colors to new ones if requested
        foreground: lightTheme.textPrimary,
        mutedForeground: lightTheme.textSecondary,
        muted: lightTheme.background,
        overlay: "rgba(0,0,0,0.5)",
        error: lightTheme.danger,
        success: lightTheme.success,
        primaryLight: "rgba(0, 113, 227, 0.1)",
        primaryForeground: lightTheme.buttonText,
    },
    typography: {
        h2: { fontSize: 24, fontWeight: "bold" },
        h3: { fontSize: 20, fontWeight: "600" },
        body: { fontSize: 14 },
        caption: { fontSize: 12 },
        label: { fontSize: 12, fontWeight: "600" },
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        full: 9999,
    },
};
