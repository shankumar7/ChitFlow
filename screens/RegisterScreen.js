import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Platform, Animated, ActivityIndicator, Alert, Image, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('REGISTER');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [successUser, setSuccessUser] = useState(null);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: useNative,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: useNative,
      })
    ]).start();
  }, [mode, isSuccess]);

  const handleAuth = async () => {
    if (mode === 'REGISTER' && !name.trim()) return;
    if (mode === 'LOGIN' && !pin.trim()) return;
    
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("pin", "==", pin.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("Invalid PIN", "No account found with this security code.");
          setLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data();
        await AsyncStorage.setItem('user_name', userData.name);
        await AsyncStorage.setItem('user_pin', userData.pin);
        
        setSuccessUser(userData.name);
        setIsSuccess(true);
      } else {
        const userRef = doc(db, 'users', name.trim().toLowerCase());
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          Alert.alert("Already Exists", "This name is already taken. Please try logging in.");
          setLoading(false);
          return;
        }

        let finalPin = pin.trim();
        const wasRandom = !finalPin;
        if (wasRandom) {
          finalPin = Math.floor(1000 + Math.random() * 9000).toString();
        } else if (finalPin.length !== 4) {
          Alert.alert("Invalid PIN", "Please provide a 4-digit PIN or leave it blank.");
          setLoading(false);
          return;
        }

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
        } else {
          setSuccessUser(name.trim());
        }
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const BrandTitle = () => (
    <View style={styles.brandTitleContainer}>
      <Text style={styles.titleHeavy}>Chit</Text>
      <Text style={styles.titleLight}>Flow</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.verticalSpine} />
        
        {isSuccess ? (
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.topSection}>
              <View style={styles.logoWrapSuccess}>
                <Image source={require('../assets/icon.png')} style={styles.logo} />
              </View>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text
                style={styles.userNameReveal}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {(successUser || name).toUpperCase()}
              </Text>
              <View style={styles.revealBar} />
            </View>
            
            {generatedPin ? (
              <View style={styles.pinDisplay}>
                <Text style={styles.pinLabel}>YOUR SECURITY PIN</Text>
                <Text style={styles.pinValue}>{generatedPin}</Text>
                <Text style={styles.pinNote}>PLEASE NOTE THIS DOWN. YOU WILL NEED IT TO LOGIN AGAIN.</Text>
              </View>
            ) : (
              <View style={styles.readySection}>
                <Text style={styles.readyTitle}>READY TO FLOW</Text>
                <Text style={styles.readySub}>Your dashboard is prepared and synchronized.</Text>
              </View>
            )}

            <View style={styles.bottomSection}>
              <Pressable 
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
                onPress={() => navigation.replace('MainTabs')}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>ENTER DASHBOARD</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.topSection}>
              <View style={styles.modeToggle}>
                <Pressable onPress={() => setMode('REGISTER')} style={[styles.modeBtn, mode === 'REGISTER' && styles.modeBtnActive]}>
                  <Text style={[styles.modeText, mode === 'REGISTER' && styles.modeTextActive]}>REGISTER</Text>
                </Pressable>
                <Pressable onPress={() => setMode('LOGIN')} style={[styles.modeBtn, mode === 'LOGIN' && styles.modeBtnActive]}>
                  <Text style={[styles.modeText, mode === 'LOGIN' && styles.modeTextActive]}>LOGIN</Text>
                </Pressable>
              </View>
              <View style={styles.logoWrap}>
                <Image source={require('../assets/icon.png')} style={styles.logo} />
              </View>
              <Text style={styles.step}>{mode === 'REGISTER' ? 'ONBOARDING' : 'WELCOME BACK'}</Text>
              <BrandTitle />
            </View>

            <View style={styles.inputSection}>
              {mode === 'REGISTER' && (
                <View style={styles.field}>
                  <Text style={styles.label}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="NAME"
                    placeholderTextColor="#D1D5DB"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoFocus
                  />
                  <View style={styles.underline} />
                </View>
              )}

              <View style={[styles.field, { marginTop: mode === 'REGISTER' ? spacing.xl : 0 }]}>
                <Text style={styles.label}>{mode === 'REGISTER' ? 'SECURITY PIN (OPTIONAL)' : 'ENTER PIN TO ACCESS'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000"
                  placeholderTextColor="#D1D5DB"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={false}
                  autoFocus={mode === 'LOGIN'}
                />
                <View style={styles.underline} />
              </View>
            </View>

            <View style={styles.bottomSection}>
              <Pressable 
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (mode === 'REGISTER' ? !name.trim() : !pin.trim()) && styles.buttonDisabled]} 
                onPress={handleAuth}
                disabled={loading || (mode === 'REGISTER' ? !name.trim() : !pin.trim())}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>{mode === 'REGISTER' ? 'CONFIRM' : 'LOGIN'}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  safeArea: { flex: 1 },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  content: { 
    flex: 1, 
    padding: spacing.xl, 
    justifyContent: 'space-between', 
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 30 : 50,
    paddingBottom: window.height * 0.05,
    ...layout.container 
  },
  topSection: { alignItems: 'flex-start' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: radius.full, padding: 4, marginBottom: spacing.xxl },
  modeBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: radius.full },
  modeBtnActive: { backgroundColor: colors.text },
  modeText: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  modeTextActive: { color: colors.white },
  logoWrap: { 
    width: normalize(60), 
    height: normalize(60), 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    marginBottom: spacing.md, 
    padding: 8,
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
    })
  },
  logoWrapSuccess: { width: normalize(44), height: normalize(44), backgroundColor: '#fff', borderRadius: 6, marginBottom: spacing.xl, padding: 6, borderWidth: 1, borderColor: '#F3F4F6' },
  logo: { width: '100%', height: '100%', resizeMode: 'contain' },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 12 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(60), fontWeight: '900', color: colors.text, letterSpacing: -3 },
  titleLight: { fontSize: normalize(60), fontWeight: '200', color: colors.text, letterSpacing: -2 },
  welcomeText: { fontSize: normalize(28), fontWeight: '300', color: colors.text, letterSpacing: -1, marginBottom: -4 },
  userNameReveal: { fontSize: normalize(52), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  revealBar: { height: 8, backgroundColor: colors.text, width: normalize(80), marginTop: 8 },
  readySection: { marginVertical: spacing.xl },
  readyTitle: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 3, marginBottom: 8 },
  readySub: { fontSize: normalize(14), color: '#9CA3AF', fontWeight: '600', lineHeight: 22 },
  inputSection: { marginVertical: spacing.xl },
  field: { marginBottom: spacing.md },
  label: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 4 },
  input: { fontSize: normalize(28), fontWeight: '900', color: colors.text, paddingVertical: spacing.sm, letterSpacing: 1, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  underline: { height: 3, backgroundColor: colors.text, width: normalize(40) },
  pinDisplay: { marginVertical: spacing.xl, alignItems: 'flex-start' },
  pinLabel: { fontSize: normalize(12), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 12 },
  pinValue: { fontSize: normalize(80), fontWeight: '900', color: colors.text, letterSpacing: 8 },
  pinNote: { fontSize: normalize(12), color: '#9CA3AF', fontWeight: '700', lineHeight: 18, marginTop: spacing.xl, maxWidth: '80%' },
  bottomSection: { alignItems: 'flex-start' },
  button: { 
    backgroundColor: colors.text, 
    paddingVertical: normalize(22), 
    paddingHorizontal: normalize(32), 
    borderRadius: radius.xs, 
    width: '100%', 
    alignItems: 'center',
    ...Platform.select({ web: { outlineStyle: 'none', cursor: 'pointer' } })
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.1 },
  buttonText: { color: colors.white, fontSize: normalize(16), fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
});
