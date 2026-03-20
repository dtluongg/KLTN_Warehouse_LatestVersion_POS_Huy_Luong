export const theme = {
  colors: {
    primary: '#059669', // Emerald 600
    primaryLight: '#d1fae5', // Emerald 100 for active backgrounds
    primaryForeground: '#ffffff',
    secondary: '#d97706', // Amber 600
    secondaryForeground: '#ffffff',
    background: '#f8fafc', // Slate 50
    foreground: '#1e293b', // Slate 800
    surface: '#ffffff',
    surfaceForeground: '#1e293b',
    muted: '#f1f5f9', // Slate 100
    mutedForeground: '#64748b', // Slate 500
    border: '#e2e8f0', // Slate 200
    input: '#e2e8f0',
    ring: '#059669',
    error: '#ef4444',
    success: '#10b981',
    info: '#3b82f6',
    warning: '#f59e0b',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 48, fontWeight: '700' as const },
    h2: { fontSize: 30, fontWeight: '700' as const },
    h3: { fontSize: 24, fontWeight: '700' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    caption: { fontSize: 14, fontWeight: '500' as const },
  }
};
