import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize, window, elevation } from '../utils/theme';

export default function WelcomeScreen({ navigation }) {
  const GlassContainer = Platform.OS === 'web' ? View : BlurView;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: useNative,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: useNative,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.05)']}
              style={styles.logoGradient}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={normalize(44)} color={colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>ChitFlow</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SMART WEALTH</Text>
          </View>
        </View>

        <View style={styles.centerSection}>
          <GlassContainer 
            intensity={40} 
            tint="light" 
            style={[
              styles.glassCard,
              Platform.OS === 'web' && { backgroundColor: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(25px)' }
            ]}
          >
            <Text style={styles.welcomeTitle}>Transform Your{"\n"}Savings</Text>
            <Text style={styles.welcomeText}>
              The most intuitive way to manage your chit groups, track payments, and grow your financial future together.
            </Text>

            <Pressable 
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={() => navigation.replace('Dashboard')}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <MaterialCommunityIcons name="arrow-right" size={normalize(20)} color={colors.white} />
              </LinearGradient>
            </Pressable>
          </GlassContainer>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SECURE • TRANSPARENT • COLLABORATIVE</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  circle1: {
    position: 'absolute',
    top: -window.height * 0.15,
    right: -window.width * 0.25,
    width: window.width * 1.2,
    height: window.width * 1.2,
    borderRadius: window.width * 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle2: {
    position: 'absolute',
    bottom: -window.height * 0.1,
    left: -window.width * 0.3,
    width: window.width * 1.1,
    height: window.width * 1.1,
    borderRadius: window.width * 0.55,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  circle3: {
    position: 'absolute',
    top: window.height * 0.3,
    left: -window.width * 0.2,
    width: window.width * 0.6,
    height: window.width * 0.6,
    borderRadius: window.width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: window.height * 0.1,
    paddingBottom: spacing.xxl,
  },
  topSection: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: normalize(90),
    height: normalize(90),
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: spacing.md,
    ...Platform.select({
      ios: { shadowColor: colors.white, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { boxShadow: '0 0 20px rgba(255,255,255,0.3)' }
    })
  },
  logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: normalize(44), fontWeight: '900', color: colors.white, letterSpacing: -1.5 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.xs,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: { color: colors.white, fontSize: normalize(10), fontWeight: '800', letterSpacing: 2 },
  centerSection: { flex: 1, justifyContent: 'center' },
  glassCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  welcomeTitle: { fontSize: normalize(32), fontWeight: '900', color: colors.white, marginBottom: spacing.md, textAlign: 'center', lineHeight: normalize(38) },
  welcomeText: { fontSize: normalize(15), color: 'rgba(255,255,255,0.85)', lineHeight: normalize(22), textAlign: 'center', marginBottom: spacing.xxl, fontWeight: '500' },
  button: { borderRadius: radius.lg, overflow: 'hidden', ...elevation.lg },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: normalize(18), gap: 12 },
  buttonText: { color: colors.white, fontSize: normalize(18), fontWeight: '800', letterSpacing: 0.5 },
  footer: { marginTop: 'auto' },
  footerText: { textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: normalize(11), fontWeight: '700', letterSpacing: 1.5 },
});

