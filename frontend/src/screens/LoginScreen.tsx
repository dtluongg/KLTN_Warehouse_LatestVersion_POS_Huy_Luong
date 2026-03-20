import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, useWindowDimensions, ImageBackground } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { theme } from '../utils/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const bgUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop';

const LoginScreen = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  
  const login = useAuthStore((state) => state.login);

  const isLargeScreen = width > 1024; // lg breakpoint in tailwind

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

  return (
    <View style={[styles.container, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
      
      {/* Cột trái: Hero Section (Chỉ trên lg:flex) */}
      {isLargeScreen && (
        <View style={styles.leftPanel}>
          <ImageBackground source={{ uri: bgUrl }} style={styles.bgImage}>
            {/* Lớp overlay màu xanh đen Gradient-like */}
            <View style={styles.overlay} />
            
            <View style={styles.leftContent}>
              <View style={styles.logoRow}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="leaf" size={24} color="#34d399" />
                </View>
                <Text style={styles.logoText}>Sáu Hiệp</Text>
              </View>

              <View style={styles.heroTextWrapper}>
                <Text style={styles.sloganWhite}>Đồng hành cùng</Text>
                <Text style={styles.sloganGreen}>Nông nghiệp Việt</Text>
                <Text style={styles.subSlogan}>
                  Cung cấp vật tư nông nghiệp chất lượng cao, giải pháp canh tác bền vững và hiệu quả cho bà con nông dân.
                </Text>
              </View>

              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>© 2024 Sáu Hiệp Store</Text>
                <View style={styles.dot} />
                <Text style={styles.footerText}>Privacy Policy</Text>
                <View style={styles.dot} />
                <Text style={styles.footerText}>Terms of Service</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      )}

      {/* Cột phải: Login Form */}
      <View style={[styles.rightPanel, !isLargeScreen && { width: '100%' }]}>
        <View style={styles.formContainer}>
          <View style={!isLargeScreen && styles.textCenter}>
            <Text style={styles.title}>Chào mừng trở lại! 👋</Text>
            <Text style={styles.subtitle}>Nhập thông tin đăng nhập để truy cập hệ thống quản lý.</Text>
          </View>
          
          <View style={styles.spaceY6}>
            {/* Input Email / Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tài khoản (Email)</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color={theme.colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={theme.colors.mutedForeground}
                />
              </View>
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Mật khẩu</Text>
                <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color={theme.colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.mutedForeground}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={[styles.row, { justifyContent: 'center' }]}>
                  <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>Đang xử lý...</Text>
                </View>
              ) : (
                <View style={[styles.row, { justifyContent: 'center' }]}>
                  <Text style={styles.buttonText}>Đăng nhập</Text>
                  <Feather name="arrow-right" size={20} color={theme.colors.primaryForeground} style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerWrapper}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerTextWrapper}>
                <Text style={styles.dividerText}>HOẶC</Text>
              </View>
            </View>

            {/* Register Link */}
            <Text style={[styles.textCenter, styles.subtitle, { marginBottom: 0 }]}>
              Chưa có tài khoản? <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </Text>

            {/* Demo Credentials */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>TÀI KHOẢN DEMO</Text>
              <View style={styles.demoRow}>
                <Text style={styles.demoRole}>Admin</Text>
                <Text style={styles.demoCreds}>admin / 123456</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={styles.demoRole}>Nhân viên bán hàng</Text>
                <Text style={styles.demoCreds}>nvbh / 123456</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={styles.demoRole}>Nhân viên kho</Text>
                <Text style={styles.demoCreds}>nvk / 123456</Text>
              </View>
            </View>
          </View>

        </View>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  leftPanel: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#064e3b', // emerald-900 backup
  },
  bgImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 78, 59, 0.85)', // Nền xanh gradient emerald-800 tới đen (giả lập)
  },
  leftContent: {
    flex: 1,
    padding: theme.spacing.xxl,
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
    borderRadius: theme.borderRadius.md,
    marginRight: 8,
  },
  logoText: {
    ...theme.typography.h3,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  heroTextWrapper: {
    maxWidth: 500,
    marginBottom: 40,
  },
  sloganWhite: {
    ...theme.typography.h1,
    color: '#ffffff',
    lineHeight: 56,
  },
  sloganGreen: {
    ...theme.typography.h1,
    color: '#34d399', // emerald-400
    lineHeight: 56,
    marginBottom: 24,
  },
  subSlogan: {
    fontSize: 18,
    color: 'rgba(209, 250, 229, 0.8)', // emerald-100/80
    lineHeight: 28,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(167, 243, 208, 0.6)', // emerald-200/60
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981', // emerald-500
    marginHorizontal: 16,
  },
  rightPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  formContainer: {
    width: '100%',
    maxWidth: 448, // max-w-md
  },
  textCenter: {
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xl,
  },
  spaceY6: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.foreground,
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.borderRadius.lg, // rounded-xl
    backgroundColor: 'rgba(241, 245, 249, 0.3)', // muted/30
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.foreground,
  },
  button: {
    backgroundColor: theme.colors.primary, // Thực ra là gradient trong gốc, ở RN dùng màu solid primary cho tiện
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.lg,
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: theme.colors.border,
  },
  dividerTextWrapper: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
  },
  dividerText: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: theme.colors.mutedForeground,
  },
  registerLink: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  demoBox: {
    marginTop: 32,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(241, 245, 249, 0.5)', // muted/50
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)', // border/50
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
  },
  demoRole: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  demoCreds: {
    fontSize: 12,
    color: theme.colors.foreground,
    fontFamily: 'monospace', // font-mono
  }
});

export default LoginScreen;
