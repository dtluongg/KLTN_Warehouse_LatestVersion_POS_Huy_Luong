export type ThemeMode = 'light' | 'dark';

export type Colors = {
  primary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  textHero: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  focusRing: string;
  danger: string;
  success: string;
  buttonText: string;
};

// Base palette tokens (not directly used by UI, used to formulate structural colors)
const palette = {
  appleBlue: '#0071e3', // <-- This is the one you change for the entire app! Try '#28a745' for Green.
  pureBlack: '#000000',
  nearBlack: '#1d1d1f',
  white: '#ffffff',
  lightGray: '#f5f5f7',
  darkSurface1: '#272729',
  darkSurface2: '#2a2a2d',
  dangerRound: '#ff3b30',
  successRound: '#34c759'
};

export const lightTheme: Colors = {
  primary: palette.appleBlue,
  background: palette.lightGray,
  surface: palette.white,
  surfaceElevated: palette.white,
  textHero: palette.pureBlack,
  textPrimary: palette.nearBlack,
  textSecondary: 'rgba(0, 0, 0, 0.8)',
  textDisabled: 'rgba(0, 0, 0, 0.48)',
  border: 'rgba(0, 0, 0, 0.04)',
  focusRing: palette.appleBlue,
  danger: palette.dangerRound,
  success: palette.successRound,
  buttonText: palette.white,
};

export const darkTheme: Colors = {
  primary: palette.appleBlue,
  background: palette.pureBlack,
  surface: palette.darkSurface1,
  surfaceElevated: palette.darkSurface2,
  textHero: palette.white,
  textPrimary: palette.white,
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textDisabled: 'rgba(255, 255, 255, 0.32)',
  border: 'rgba(255, 255, 255, 0.1)',
  focusRing: palette.appleBlue,
  danger: palette.dangerRound,
  success: palette.successRound,
  buttonText: palette.white,
};
