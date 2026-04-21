import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

// Apple's font family logic:
// At 20px or above -> Display text
// At 19px or below -> Text
const fonts = {
  display: isIOS ? 'System' : 'System', // On iOS, System defaults to San Francisco (SF Pro)
  text: isIOS ? 'System' : 'System',
};

export const typography = {
  // 56px (3.50rem)
  displayHero: {
    fontFamily: fonts.display,
    fontSize: 56,
    fontWeight: '600' as const,
    lineHeight: 60, // ~1.07 ratio
    letterSpacing: -0.28,
  },
  // 40px (2.50rem)
  heading1: {
    fontFamily: fonts.display,
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 44, // ~1.10 ratio
    letterSpacing: 0,
  },
  // 28px (1.75rem)
  heading2: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 32, // ~1.14 ratio
    letterSpacing: 0.196,
  },
  // 21px
  titleBox: {
    fontFamily: fonts.display,
    fontSize: 21,
    fontWeight: '700' as const,
    lineHeight: 25, // ~1.19 ratio
    letterSpacing: 0.231,
  },
  // 17px
  body: {
    fontFamily: fonts.text,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 25, // ~1.47 ratio
    letterSpacing: -0.374,
  },
  // 17px SemiBold
  bodyEmphasized: {
    fontFamily: fonts.text,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 21, // ~1.24 ratio (tight)
    letterSpacing: -0.374,
  },
  // 14px
  caption: {
    fontFamily: fonts.text,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.224,
  },
  // 14px SemiBold
  captionBold: {
    fontFamily: fonts.text,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: -0.224,
  },
  // 12px
  micro: {
    fontFamily: fonts.text,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: -0.12,
  },
};
