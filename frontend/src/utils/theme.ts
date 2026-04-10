export const theme = {
    colors: {
        primary: "#0f766e", // Teal 600 - Premium modern feel
        primaryLight: "#ccfbf1", // Teal 100
        primaryForeground: "#ffffff",
        secondary: "#f59e0b", // Amber 500
        secondaryForeground: "#ffffff",
        background: "#f8fafc", // Slate 50
        foreground: "#0f172a", // Slate 900
        surface: "#ffffff",
        surfaceRaised: "#f1f5f9",
        surfaceForeground: "#1e293b", // Slate 800
        overlay: "rgba(15, 23, 42, 0.4)", // Slate 900 with alpha
        muted: "#f1f5f9", 
        mutedForeground: "#64748b", // Slate 500
        border: "#e2e8f0", // Slate 200
        input: "#f1f5f9",
        ring: "#14b8a6", // Teal 500
        error: "#ef4444",
        success: "#10b981",
        info: "#3b82f6",
        warning: "#f59e0b",
        glassBg: "rgba(255, 255, 255, 0.85)", // Glass effect background
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
    shadows: {
        sm: {
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1, // Android
        },
        md: {
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 3,
        },
        lg: {
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 15,
            elevation: 5,
        },
        float: {
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.1,
            shadowRadius: 25,
            elevation: 10,
        }
    }
};
