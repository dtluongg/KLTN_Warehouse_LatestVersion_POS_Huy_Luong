import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style,
  elevated = false,
}) => {
  const { colors, metrics } = useTheme();

  return (
    <View 
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: metrics.borderRadius.medium,
          padding: metrics.spacing.md,
          ...(elevated ? metrics.shadows.appleCard : {}),
        },
        style
      ]}
    >
      {children}
    </View>
  );
};
