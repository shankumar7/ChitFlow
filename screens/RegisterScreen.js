import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, Animated, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: useNative,
    }).start();
  }, [fadeAnim, isSuccess]);

  const handleRegister = async () => {
    if (!name.trim()) return;
    
    let finalPin = pin.trim();
    const wasRandom = !finalPin;
    if (wasRandom) {
      finalPin = Math.floor(1000 + Math.random() * 9000).toString();
    }

    setLoading(true);

    try {
      const userRef = doc(db, 'users', name.trim().toLowerCase());
      await setDoc(userRef, {
        name: name.trim(),
        pin: finalPin,
        createdAt: new Date().toISOString(),
        groups: [],
        teams: [],
      });

      await AsyncStorage.setItem('user_name', name.trim());
      await AsyncStorage.setItem('user_pin', finalPin);

      if (wasRandom) {
        setGeneratedPin(finalPin);
        setIsSuccess(true);
        fadeAnim.setValue(0);
      } else {
        navigation.replace('Dashboard');
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.verticalSpine} />
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.topSection}>
            <Text style={styles.step}>SUCCESS</Text>
            <Text style={styles.title}>Welcome,{"\n"}{name}</Text>
          </View>

          <View style={styles.pinDisplay}>
            <Text style={styles.pinLabel}>YOUR SECURITY PIN</Text>
            <Text style={styles.pinValue}>{generatedPin}</Text>
            <Text style={styles.pinNote}>PLEASE NOTE THIS DOWN. YOU WILL NEED IT TO ACCESS YOUR DATA.</Text>
          </View>

          <View style={styles.bottomSection}>
            <Pressable 
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => navigation.replace('Dashboard')}
            >
              <Text style={styles.buttonText}>LET'S GO</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.verticalSpine} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.topSection}>
          <Text style={styles.step}>ONBOARDING</Text>
          <Text style={styles.title}>Identification</Text>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.field}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="NAME"
              placeholderTextColor="#D1D5DB"
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
            <View style={styles.underline} />
          </View>

          <View style={[styles.field, { marginTop: spacing.xl }]}>
            <Text style={styles.label}>SECURITY PIN (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="0000"
              placeholderTextColor="#D1D5DB"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={false} // Shown for clarity as requested
            />
            <View style={styles.underline} />
          </View>
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
              <Text style={styles.buttonText}>CONFIRM</Text>
            )}
          </Pressable>
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
    paddingVertical: window.height * 0.1,
    ...layout.container,
  },
  topSection: {
    alignItems: 'flex-start',
  },
  step: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  inputSection: { marginVertical: spacing.xl },
  field: { marginBottom: spacing.md },
  label: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 4 },
  input: {
    fontSize: normalize(28),
    fontWeight: '900',
    color: colors.text,
    paddingVertical: spacing.sm,
    letterSpacing: 1,
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  },
  underline: { height: 3, backgroundColor: colors.text, width: normalize(40) },
  pinDisplay: { marginVertical: spacing.xl, alignItems: 'flex-start' },
  pinLabel: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 12 },
  pinValue: { fontSize: normalize(80), fontWeight: '900', color: colors.text, letterSpacing: 8 },
  pinNote: { fontSize: normalize(12), color: '#9CA3AF', fontWeight: '700', lineHeight: 18, marginTop: spacing.xl, maxWidth: '80%' },
  bottomSection: { alignItems: 'flex-start' },
  button: { backgroundColor: colors.text, paddingVertical: normalize(20), paddingHorizontal: normalize(40), borderRadius: radius.xs, width: '100%', alignItems: 'center' },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.2 },
  buttonText: { color: colors.white, fontSize: normalize(18), fontWeight: '900', letterSpacing: 2 },
});
