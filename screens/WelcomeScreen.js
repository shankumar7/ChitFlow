import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated, Image } from 'react-native';
import { colors, spacing, radius, normalize, window, elevation } from '../utils/theme';

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: useNative,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: useNative,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.topSection}>
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>ChitFlow</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SMART WEALTH</Text>
          </View>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.minimalCard}>
            <Text style={styles.welcomeTitle}>Minimal Effort.{"\n"}Maximum Savings.</Text>
            <Text style={styles.welcomeText}>
              An intuitive way to manage your chit groups, track payments, and grow your wealth.
            </Text>

            <Pressable 
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={() => navigation.replace('Dashboard')}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SECURE • TRANSPARENT • COLLABORATIVE</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: window.height * 0.12,
    paddingBottom: spacing.xxl,
  },
  topSection: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: normalize(100),
    height: normalize(100),
    marginBottom: spacing.md,
  },
  appName: { 
    fontSize: normalize(40), 
    fontWeight: '900', 
    color: colors.text, 
    letterSpacing: -1.5 
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.xs,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  badgeText: { color: colors.text, fontSize: normalize(10), fontWeight: '900', letterSpacing: 2 },
  centerSection: { flex: 1, justifyContent: 'center' },
  minimalCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  welcomeTitle: { 
    fontSize: normalize(34), 
    fontWeight: '900', 
    color: colors.text, 
    marginBottom: spacing.md, 
    textAlign: 'center', 
    lineHeight: normalize(40) 
  },
  welcomeText: { 
    fontSize: normalize(16), 
    color: colors.textMuted, 
    lineHeight: normalize(24), 
    textAlign: 'center', 
    marginBottom: spacing.xxl, 
    fontWeight: '500',
    maxWidth: '90%',
  },
  button: { 
    backgroundColor: colors.text, 
    borderRadius: radius.full, 
    paddingVertical: normalize(18), 
    paddingHorizontal: normalize(40),
    width: '100%',
    alignItems: 'center',
    ...elevation.md 
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.white, fontSize: normalize(18), fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  footer: { marginTop: 'auto' },
  footerText: { textAlign: 'center', color: colors.textLight, fontSize: normalize(11), fontWeight: '800', letterSpacing: 2 },
});
