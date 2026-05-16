import { Platform, Dimensions } from 'react-native';

const isIOS = Platform.OS === 'ios';

const fonts = {
  display: isIOS ? 'System' : 'System',
  text: isIOS ? 'System' : 'System',
};

// --- Responsive Font Scale ---
// Base width được thiết kế trên tablet/desktop ~1024px
// Trên mobile (~390px), font sẽ thu nhỏ theo tỷ lệ
const BASE_WIDTH = 1024;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Clamp scale trong khoảng 0.65 (rất nhỏ) - 1.0 (desktop)
const scale = Math.min(1.0, Math.max(0.65, SCREEN_WIDTH / BASE_WIDTH));

// Hàm tính fontSize responsive
const rf = (desktopSize: number) => Math.round(desktopSize * scale);

export const typography = {
  // 56px → co nhỏ tối đa ~36px trên mobile
  displayHero: {
    fontFamily: fonts.display,
    fontSize: rf(56),
    fontWeight: '600' as const,
    lineHeight: rf(60),
    letterSpacing: -0.28,
  },
  // 40px → ~26px trên mobile
  heading1: {
    fontFamily: fonts.display,
    fontSize: rf(40),
    fontWeight: '600' as const,
    lineHeight: rf(44),
    letterSpacing: 0,
  },
  // 28px → ~18px trên mobile
  heading2: {
    fontFamily: fonts.display,
    fontSize: rf(28),
    fontWeight: '400' as const,
    lineHeight: rf(32),
    letterSpacing: 0.196,
  },
  // 21px → ~14px trên mobile
  titleBox: {
    fontFamily: fonts.display,
    fontSize: rf(21),
    fontWeight: '700' as const,
    lineHeight: rf(25),
    letterSpacing: 0.231,
  },
  // 17px — body text giữ nguyên để dễ đọc
  body: {
    fontFamily: fonts.text,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 25,
    letterSpacing: -0.374,
  },
  // 17px SemiBold
  bodyEmphasized: {
    fontFamily: fonts.text,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 21,
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
