import { useThemeStore } from '../store/themeStore';
import { typography } from '../theme/typography';
import { metrics } from '../theme/metrics';

export const useTheme = () => {
  const { colors, mode, toggleTheme } = useThemeStore();
  
  return {
    colors,
    mode,
    toggleTheme,
    typography,
    metrics
  };
};
