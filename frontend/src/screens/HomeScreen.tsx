import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/authStore';

const HomeScreen = () => {
  const { username, role, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Xin chào, {username}!</Text>
      <Text style={styles.role}>Quyền của bạn: {role}</Text>
      
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Đăng Xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f3640',
  },
  role: {
    fontSize: 16,
    color: '#7f8fa6',
    marginTop: 8,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#e84118',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;
