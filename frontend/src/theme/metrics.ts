export const metrics = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    micro: 5,
    small: 8,     // Buttons, inputs, small cards
    medium: 12,   // Feature cards, image containers
    large: 24,    // Large containers or bottom sheets
    pill: 980,    // Standalone CTAs, learn more
    circle: 9999, // Avatar, icon buttons
  },
  shadows: {
    // rgba(0, 0, 0, 0.22) 3px 5px 30px 0px -> Apple product card style shadow
    appleCard: {
      shadowColor: '#000000',
      shadowOffset: { width: 3, height: 5 },
      shadowOpacity: 0.22,
      shadowRadius: 15,
      elevation: 5, // Android fallback
    },
    shallow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }
  }
};
