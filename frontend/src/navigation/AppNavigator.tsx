import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import MainDrawerNavigator from './MainDrawerNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          // Chưa đăng nhập -> Chỉ nhìn thấy màn Login
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Đã đăng nhập -> Nhìn thấy luồng Drawer Dashboard Menu
          <Stack.Screen name="MainDrawer" component={MainDrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
