import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography } from './Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'pill' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const { colors, metrics } = useTheme();

  // Xác định màu sắc theo biến thể (variant)
  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.surfaceElevated;
      case 'pill': return 'transparent'; // Viền màu chính
      case 'danger': return colors.danger;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textDisabled;
    switch (variant) {
      case 'primary': return colors.buttonText;
      case 'secondary': return colors.textPrimary;
      case 'pill': return colors.primary;
      case 'danger': return colors.buttonText;
      default: return colors.buttonText;
    }
  };

  const getBorder = () => {
    if (variant === 'pill') {
      return { borderWidth: 1, borderColor: colors.primary };
    }
    if (variant === 'secondary') {
      return { borderWidth: 1, borderColor: colors.border };
    }
    return { borderWidth: 0 };
  };

  const getRadius = () => {
    if (variant === 'pill') return metrics.borderRadius.pill;
    return metrics.borderRadius.small;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: getRadius(),
          ...getBorder(),
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Typography 
          variant={variant === 'pill' ? 'captionBold' : 'body'} 
          color={getTextColor()}
          centered
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48, // Touch target Apple
  },
});
