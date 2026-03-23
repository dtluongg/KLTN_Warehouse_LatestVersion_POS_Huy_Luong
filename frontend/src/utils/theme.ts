export const theme = {
    colors: {
        primary: "#059669", // Emerald 600
        primaryLight: "#d1fae5", // Emerald 100 for active backgrounds
        primaryForeground: "#ffffff",
        secondary: "#d97706", // Amber 600
        secondaryForeground: "#ffffff",
        background: "#f8fafc", // Slate 50
        foreground: "#1e293b", // Slate 800
        surface: "#ffffff",
        surfaceRaised: "#f1f5f9",
        surfaceForeground: "#1e293b",
        overlay: "rgba(2, 6, 23, 0.45)",
        muted: "#f1f5f9", // Slate 100
        mutedForeground: "#64748b", // Slate 500
        border: "#e2e8f0", // Slate 200
        input: "#e2e8f0",
        ring: "#059669",
        error: "#ef4444",
        success: "#10b981",
        info: "#3b82f6",
        warning: "#f59e0b",
    },
    spacing: {
        xxs: 2,
        xs: 4,
        sm: 8,
        smd: 12,
        md: 16,
        mdl: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64,
    },
    borderRadius: {
        sm: 6,
        md: 10,
        lg: 14,
        xl: 20,
        full: 9999,
    },
    typography: {
        h1: { fontSize: 40, lineHeight: 48, fontWeight: "700" as const },
        h2: { fontSize: 30, lineHeight: 38, fontWeight: "700" as const },
        h3: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
        title: { fontSize: 20, lineHeight: 28, fontWeight: "700" as const },
        body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
        label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
        caption: { fontSize: 12, lineHeight: 18, fontWeight: "500" as const },
    },
};
