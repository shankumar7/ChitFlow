import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize, window, elevation } from '../utils/theme';

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: useNative,
    }).start();

    // Animate line expansion
    Animated.timing(lineWidth, {
      toValue: 1,
      duration: 1500,
      delay: 500,
      useNativeDriver: false, // width doesn't support native driver
    }).start();
  }, [fadeAnim, lineWidth]);

  const animatedLineWidth = lineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, normalize(80)],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle} />
      <View style={styles.verticalSpine} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <Text style={styles.version}>VERSION 1.0</Text>
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.titleContainer}>
            <Text style={styles.appNameBold}>Chit</Text>
            <Text style={styles.appNameLight}>Flow</Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.actionWrap}>
            <Pressable 
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={() => navigation.navigate('Register')}
            >
              <View style={styles.buttonRow}>
                <Text style={styles.buttonText}>Start Your Flow</Text>
                <MaterialCommunityIcons name="arrow-right" size={24} color={colors.text} style={styles.arrow} />
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  bgCircle: {
    position: 'absolute',
    top: -window.width * 0.2,
    right: -window.width * 0.2,
    width: window.width * 1.5,
    height: window.width * 1.5,
    borderRadius: window.width * 0.75,
    backgroundColor: '#F3F4F6',
  },
  verticalSpine: {
    position: 'absolute',
    left: spacing.xl + normalize(40),
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: window.height * 0.1,
  },
  topSection: { 
    alignItems: 'flex-start',
  },
  version: {
    fontSize: normalize(10),
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  logo: {
    width: normalize(80),
    height: normalize(80),
    marginBottom: spacing.md,
    zIndex: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  appNameBold: { fontSize: normalize(52), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  appNameLight: { fontSize: normalize(52), fontWeight: '200', color: colors.text, letterSpacing: -2 },
  bottomSection: {
    alignItems: 'flex-start',
  },
  actionWrap: {
    marginBottom: spacing.xl,
  },
  button: { 
    paddingVertical: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrow: {
    marginTop: 2,
  },
  buttonPressed: { opacity: 0.6 },
  buttonText: { 
    color: colors.text, 
    fontSize: normalize(20), 
    fontWeight: '900', 
    letterSpacing: 1, 
    textTransform: 'uppercase' 
  },
  accentLine: {
    height: 4,
    backgroundColor: colors.text,
    marginTop: 4,
  },
  location: {
    fontSize: normalize(10),
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 3,
  }
});
