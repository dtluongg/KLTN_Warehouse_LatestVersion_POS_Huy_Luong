import { create } from 'zustand';
import { Colors, ThemeMode, lightTheme, darkTheme } from '../theme/colors';

interface ThemeState {
  mode: ThemeMode;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light', // Về sau có thể dùng Appearance.getColorScheme() từ react-native
  colors: lightTheme,
  setMode: (mode: ThemeMode) => 
    set(() => ({ mode, colors: mode === 'light' ? lightTheme : darkTheme })),
  toggleTheme: () => 
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      return { mode: newMode, colors: newMode === 'light' ? lightTheme : darkTheme };
    }),
}));
