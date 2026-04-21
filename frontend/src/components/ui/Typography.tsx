import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';

type VariantType = keyof typeof typography;

interface TypographyProps extends TextProps {
  variant?: VariantType;
  color?: string; // Tùy chọn override màu nếu thực sự cần
  centered?: boolean;
}

export const Typography: React.FC<TypographyProps> = ({ 
  variant = 'body', 
  color, 
  centered = false,
  style, 
  children, 
  ...props 
}) => {
  const { colors } = useTheme();
  
  // Xác định màu chữ mặc định dựa trên màn sáng/tối
  const defaultColor = colors.textPrimary;
  
  return (
    <Text 
      style={[
        typography[variant],
        { color: color || defaultColor },
        centered && { textAlign: 'center' },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
