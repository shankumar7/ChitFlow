import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, Animated, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: useNative,
    }).start();

    Animated.timing(inputLine, {
      toValue: 1,
      duration: 1200,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim, inputLine]);

  const handleRegister = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      // 1. Save to Firestore
      const userRef = doc(db, 'users', name.trim().toLowerCase());
      await setDoc(userRef, {
        name: name.trim(),
        createdAt: new Date().toISOString(),
        groups: [],
        teams: [],
        pin: null
      });

      // 2. Persist locally
      await AsyncStorage.setItem('user_name', name.trim());

      // 3. Navigate to Dashboard
      navigation.replace('Dashboard');
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const animatedLineWidth = inputLine.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.verticalSpine} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <Text style={styles.step}>STEP 01</Text>
          <Text style={styles.title}>What's your{"\n"}name?</Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="TYPE HERE"
            placeholderTextColor="#D1D5DB"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
          />
          <Animated.View style={[styles.underline, { width: animatedLineWidth }]} />
        </View>

        <View style={styles.bottomSection}>
          <Pressable 
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              !name.trim() && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Confirm Identity</Text>
            )}
          </Pressable>
          <Text style={styles.hint}>NO PASSWORD REQUIRED. JUST YOUR NAME.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  verticalSpine: {
    position: 'absolute',
    left: spacing.xl + normalize(4),
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: window.height * 0.12,
    ...layout.container,
  },
  topSection: {
    alignItems: 'flex-start',
  },
  step: {
    fontSize: normalize(12),
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: normalize(48),
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -2,
    lineHeight: normalize(54),
  },
  inputSection: {
    marginVertical: spacing.xxl,
  },
  input: {
    fontSize: normalize(32),
    fontWeight: '900',
    color: colors.text,
    paddingVertical: spacing.md,
    letterSpacing: -1,
  },
  underline: {
    height: 4,
    backgroundColor: colors.text,
  },
  bottomSection: {
    alignItems: 'flex-start',
  },
  button: {
    backgroundColor: colors.text,
    paddingVertical: normalize(20),
    paddingHorizontal: normalize(40),
    borderRadius: radius.xs,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.2 },
  buttonText: {
    color: colors.white,
    fontSize: normalize(16),
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hint: {
    marginTop: spacing.lg,
    fontSize: normalize(10),
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  }
});
