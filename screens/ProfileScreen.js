import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [userPin, setUserPin] = useState('');
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem('user_name');
      const pin = await AsyncStorage.getItem('user_pin');
      setUserName(name || 'USER');
      setUserPin(pin || '0000');
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.verticalSpine} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.step}>ACCOUNT IDENTITY</Text>
          <Text style={styles.title}>{userName.toUpperCase()}</Text>
          <View style={styles.titleBar} />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>SECURITY PIN</Text>
            <Text style={styles.infoValue}>{userPin}</Text>
          </View>
          
          <View style={[styles.infoCard, { marginTop: spacing.xl }]}>
            <Text style={styles.infoLabel}>ACCOUNT TYPE</Text>
            <Text style={styles.infoValue}>PRIMARY ADMINISTRATOR</Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Pressable 
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]} 
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>LOGOUT SESSION</Text>
          </Pressable>
          <Text style={styles.footerNote}>CHITFLOW CORE VERSION 1.0.4</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'space-between', paddingVertical: window.height * 0.06, ...layout.container },
  backBtn: { marginBottom: spacing.xl, marginLeft: -4 },
  topSection: { alignItems: 'flex-start' },
  step: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: normalize(48), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleBar: { height: 6, backgroundColor: colors.text, width: normalize(60), marginTop: 8 },
  infoSection: { marginVertical: spacing.xxl },
  infoCard: { alignItems: 'flex-start' },
  infoLabel: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 2, marginBottom: 8 },
  infoValue: { fontSize: normalize(24), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  bottomSection: { alignItems: 'flex-start' },
  logoutBtn: { backgroundColor: colors.text, paddingVertical: normalize(20), paddingHorizontal: normalize(40), borderRadius: radius.xs, width: '100%', alignItems: 'center' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  logoutText: { color: colors.white, fontSize: normalize(16), fontWeight: '900', letterSpacing: 3 },
  footerNote: { marginTop: spacing.xl, fontSize: normalize(10), fontWeight: '800', color: '#E5E7EB', letterSpacing: 2 },
});
