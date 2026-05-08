import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    Animated.timing(lineWidth, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim, lineWidth]);

  const animatedLineWidth = lineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '60%'],
  });

  return (
    <View style={styles.container}>
      
      <Animated.View style={[
        styles.content, 
        { 
          opacity: fadeAnim,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + window.height * 0.05
        }
      ]}>
        <View style={styles.topSection}>
          <View style={styles.logoWrap}>
            <Image source={require('../assets/icon.png')} style={styles.logo} />
          </View>
          <Text style={styles.version}>VERSION 1.0.2</Text>
          <View style={styles.brandContainer}>
            <Text style={styles.titleHeavy}>Chit</Text>
            <Text style={styles.titleLight}>Flow</Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.actionWrap}>
            <Pressable 
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Register')}
            >
              <View style={styles.buttonRow}>
                <Text style={styles.buttonText}>START YOUR FLOW</Text>
                <MaterialCommunityIcons name="arrow-right" size={24} color={colors.text} />
              </View>
            </Pressable>
            <Animated.View style={[styles.accentLine, { width: animatedLineWidth }]} />
          </View>
          <Text style={styles.location}>Reva • 2026</Text>
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
    justifyContent: 'space-between', 
    ...layout.container 
  },
  logoWrap: { 
    width: normalize(80), 
    height: normalize(80), 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: spacing.xl, 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    padding: 12,
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }
    })
  },
  logo: { width: '100%', height: '100%', resizeMode: 'contain' },
  version: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 8 },
  brandContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -4 },
  titleHeavy: { fontSize: normalize(64), fontWeight: '900', color: colors.text, letterSpacing: -4 },
  titleLight: { fontSize: normalize(64), fontWeight: '200', color: colors.text, letterSpacing: -2 },
  bottomSection: { alignItems: 'flex-start' },
  actionWrap: { width: '100%', marginBottom: spacing.xl },
  button: { paddingVertical: spacing.md, alignItems: 'flex-start' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buttonText: { fontSize: normalize(20), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  accentLine: { height: 4, backgroundColor: colors.text, marginTop: 4 },
  location: { fontSize: normalize(10), fontWeight: '800', color: '#E5E7EB', letterSpacing: 2 },
  buttonPressed: { opacity: 0.7 },
});
