import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Alert, useWindowDimensions, ImageBackground } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../../../api/authApi';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { Typography } from '../../../components/ui/Typography';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const bgUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop';

const LoginScreen = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  
  const login = useAuthStore((state) => state.login);
  const { colors, metrics, mode } = useTheme();

  const isLargeScreen = width > 1024;

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      await login(res);
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const isDark = mode === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, flexDirection: isLargeScreen ? 'row' : 'column' }]}>
      
      {/* Left Column: Hero Section (Desktop only) */}
      {isLargeScreen && (
        <View style={styles.leftPanel}>
          <ImageBackground source={{ uri: bgUrl }} style={styles.bgImage}>
            <View style={styles.overlay} />
            <View style={[styles.leftContent, { padding: metrics.spacing.xxl }]}>
              <View style={styles.logoRow}>
                <View style={[styles.iconBox, { borderRadius: metrics.borderRadius.medium }]}>
                  <MaterialCommunityIcons name="leaf" size={24} color="#34d399" />
                </View>
                <Typography variant="heading2" color="#ffffff" style={{ letterSpacing: -0.5 }}>Sáu Hiệp</Typography>
              </View>

              <View style={styles.heroTextWrapper}>
                <Typography variant="displayHero" color="#ffffff">Đồng hành cùng</Typography>
                <Typography variant="displayHero" color="#34d399" style={{ marginBottom: 24 }}>Nông nghiệp Việt</Typography>
                <Typography variant="body" color="rgba(209, 250, 229, 0.8)">
                  Cung cấp vật tư nông nghiệp chất lượng cao, giải pháp canh tác bền vững và hiệu quả cho bà con nông dân.
                </Typography>
              </View>

              <View style={styles.footerLinks}>
                <Typography variant="caption" color="rgba(167, 243, 208, 0.6)">© 2024 Sáu Hiệp Store</Typography>
                <View style={styles.dot} />
                <Typography variant="caption" color="rgba(167, 243, 208, 0.6)">Privacy Policy</Typography>
                <View style={styles.dot} />
                <Typography variant="caption" color="rgba(167, 243, 208, 0.6)">Terms of Service</Typography>
              </View>
            </View>
          </ImageBackground>
        </View>
      )}

      {/* Right Column: Login Form */}
      <View style={[styles.rightPanel, { backgroundColor: colors.background }, !isLargeScreen && { width: '100%' }]}>
        <View style={styles.formContainer}>
          <View style={!isLargeScreen && styles.textCenter}>
            <Typography variant="heading1" style={{ marginBottom: 8 }}>Chào mừng trở lại! 👋</Typography>
            <Typography variant="body" color={colors.textSecondary} style={{ marginBottom: metrics.spacing.xl }}>
              Nhập thông tin đăng nhập để truy cập hệ thống quản lý.
            </Typography>
          </View>
          
          <View style={styles.spaceY6}>
            {/* Input Email / Username */}
            <View style={[styles.inputGroup, { marginBottom: metrics.spacing.lg }]}>
              <Typography variant="captionBold" style={{ marginBottom: 8 }}>Tài khoản (Email)</Typography>
              <View style={[
                  styles.inputWrapper, 
                  { 
                    borderColor: colors.border, 
                    borderRadius: metrics.borderRadius.small,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
                  }
                ]}>
                <Feather name="mail" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textDisabled}
                />
              </View>
            </View>

            {/* Input Password */}
            <View style={[styles.inputGroup, { marginBottom: metrics.spacing.lg }]}>
              <View style={styles.passwordHeader}>
                <Typography variant="captionBold">Mật khẩu</Typography>
                <Typography variant="captionBold" color={colors.primary}>Quên mật khẩu?</Typography>
              </View>
              <View style={[
                  styles.inputWrapper, 
                  { 
                    borderColor: colors.border, 
                    borderRadius: metrics.borderRadius.small,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
                  }
                ]}>
                <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDisabled}
                />
              </View>
            </View>

            {/* Submit Button */}
            <Button 
                title="Đăng nhập" 
                variant="primary" 
                onPress={handleLogin} 
                loading={loading}
                style={{ marginTop: 8 }}
            />

            {/* Divider */}
            <View style={styles.dividerWrapper}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <View style={[styles.dividerTextWrapper, { backgroundColor: colors.background }]}>
                <Typography variant="micro" color={colors.textDisabled}>HOẶC</Typography>
              </View>
            </View>

            {/* Register Link */}
            <View style={styles.textCenter}>
                <Typography variant="body" color={colors.textSecondary}>
                Chưa có tài khoản? <Typography variant="bodyEmphasized" color={colors.primary}>Đăng ký ngay</Typography>
                </Typography>
            </View>

            {/* Demo Credentials within Card */}
            <Card elevated={false} style={{ marginTop: 32, borderWidth: 1, borderColor: colors.border }}>
              <Typography variant="micro" color={colors.textSecondary} style={{ marginBottom: 12 }}>TÀI KHOẢN DEMO</Typography>
              <View style={[styles.demoRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Typography variant="micro" color={colors.textSecondary}>Admin</Typography>
                <Typography variant="micro" color={colors.textPrimary}>admin / 123456</Typography>
              </View>
              <View style={[styles.demoRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Typography variant="micro" color={colors.textSecondary}>Nhân viên bán hàng</Typography>
                <Typography variant="micro" color={colors.textPrimary}>nvbh / 123456</Typography>
              </View>
              <View style={[styles.demoRow, { backgroundColor: colors.background, borderColor: colors.border, marginBottom: 0 }]}>
                <Typography variant="micro" color={colors.textSecondary}>Nhân viên kho</Typography>
                <Typography variant="micro" color={colors.textPrimary}>nvk / 123456</Typography>
              </View>
            </Card>
          </View>

        </View>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  leftPanel: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#064e3b',
  },
  bgImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    marginRight: 8,
  },
  heroTextWrapper: {
    maxWidth: 500,
    marginBottom: 40,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
    marginHorizontal: 16,
  },
  rightPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  formContainer: {
    width: '100%',
    maxWidth: 448,
  },
  textCenter: {
    alignItems: 'center',
  },
  spaceY6: {
    width: '100%',
  },
  inputGroup: {},
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 17, // SF Pro text optimal size
  },
  dividerWrapper: {
    position: 'relative',
    marginVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
  },
  dividerTextWrapper: {
    paddingHorizontal: 8,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default LoginScreen;
