import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Updates from 'expo-updates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({ name: '', pin: '', groupsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState('LATEST'); // LATEST, CHECKING, DOWNLOADING, READY
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedName = await AsyncStorage.getItem('user_name');
      const storedPin = await AsyncStorage.getItem('user_pin');
      
      if (storedName) {
        const userRef = doc(db, 'users', storedName.toLowerCase());
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser({ 
            name: userData.name || storedName, 
            pin: userData.pin || storedPin,
            groupsCount: userData.groups?.length || 0
          });
        } else {
          setUser({ name: storedName, pin: storedPin, groupsCount: 0 });
        }
      }

      const useNative = Platform.OS !== 'web';
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: useNative,
      }).start();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onCheckForUpdate = async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Web Version", "You are always on the latest version on the web.");
      return;
    }

    try {
      setUpdateStatus('CHECKING');
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setUpdateStatus('DOWNLOADING');
        await Updates.fetchUpdateAsync();
        setUpdateStatus('READY');
        Alert.alert(
          "Update Ready", 
          "New version downloaded. Install the update now to apply changes.",
          [{ text: "INSTALL", onPress: () => Updates.reloadAsync() }]
        );
      } else {
        setUpdateStatus('LATEST');
        Alert.alert("Up to Date", "You are already using the latest version of ChitFlow.");
      }
    } catch (e) {
      console.error("Update check failed:", e);
      setUpdateStatus('LATEST');
      // In Expo Go or Dev mode, Updates might fail if not configured
      if (__DEV__) {
        Alert.alert("Dev Mode", "OTA Updates are only active in production builds. You're good to go!");
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to exit your session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.verticalSpine} />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.step}>ACCOUNT HUB</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>Chit</Text>
            <Text style={styles.titleLight}>Flow</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        ) : (
          <>
            <View style={styles.profileSection}>
              <View style={styles.avatarWrap}>
                <MaterialCommunityIcons name="account" size={normalize(40)} color={colors.white} />
              </View>
              <Text style={styles.label}>IDENTIFIED AS</Text>
              <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{user.name.toUpperCase()}</Text>
              <View style={styles.revealBar} />
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>SECURITY PIN</Text>
                <Text style={styles.detailValue}>{user.pin}</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>GROUPS</Text>
                <Text style={styles.detailValue}>{user.groupsCount}</Text>
              </View>
            </View>

            <View style={styles.versionHub}>
              <View style={styles.versionHeader}>
                <Text style={styles.label}>VERSION DIAGNOSTICS</Text>
                <View style={[styles.statusTag, updateStatus === 'READY' && styles.statusTagReady]}>
                  <Text style={styles.statusText}>{updateStatus}</Text>
                </View>
              </View>
              <View style={styles.versionCard}>
                <View style={styles.versionInfo}>
                  <Text style={styles.buildLabel}>CURRENT BUILD</Text>
                  <Text style={styles.buildValue}>v1.0.2-STABLE</Text>
                </View>
                <Pressable 
                  style={[styles.updateBtn, (updateStatus === 'CHECKING' || updateStatus === 'DOWNLOADING') && styles.updateBtnDisabled]} 
                  onPress={updateStatus === 'READY' ? () => Updates.reloadAsync() : onCheckForUpdate}
                  disabled={updateStatus === 'CHECKING' || updateStatus === 'DOWNLOADING'}
                >
                  {updateStatus === 'CHECKING' || updateStatus === 'DOWNLOADING' ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.updateBtnText}>{updateStatus === 'READY' ? 'INSTALL' : 'CHECK'}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomSection}>
          <Pressable 
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Log Out</Text>
            <MaterialCommunityIcons name="logout" size={20} color={colors.white} />
          </Pressable>
          <Text style={styles.note}>End your session</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, padding: spacing.xl, paddingVertical: window.height * 0.08, ...layout.container },
  header: { marginBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileSection: { marginVertical: spacing.xl },
  avatarWrap: { 
    width: normalize(70), 
    height: normalize(70), 
    backgroundColor: colors.text, 
    borderRadius: radius.xs, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.lg,
    ...Platform.select({
      web: { boxShadow: '0 8px 20px rgba(0,0,0,0.15)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }
    })
  },
  label: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 4 },
  name: { fontSize: normalize(42), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  revealBar: { height: 6, backgroundColor: colors.text, width: normalize(60), marginTop: 4 },
  detailsGrid: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xl },
  detailCard: { flex: 1, backgroundColor: '#F9FAFB', padding: spacing.md, borderRadius: radius.xs },
  detailLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 },
  detailValue: { fontSize: normalize(18), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  versionHub: { marginVertical: spacing.xl },
  versionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusTag: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusTagReady: { backgroundColor: '#3B82F6' },
  statusText: { color: colors.white, fontSize: normalize(8), fontWeight: '900', letterSpacing: 1 },
  versionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: spacing.md, borderRadius: radius.xs, borderLeftWidth: 3, borderLeftColor: '#10B981' },
  versionInfo: { flex: 1 },
  buildLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 2 },
  buildValue: { fontSize: normalize(14), fontWeight: '900', color: colors.text },
  updateBtn: { backgroundColor: colors.text, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4, minWidth: 80, alignItems: 'center' },
  updateBtnDisabled: { opacity: 0.5 },
  updateBtnText: { color: colors.white, fontSize: normalize(10), fontWeight: '900', letterSpacing: 1 },
  bottomSection: { marginTop: 'auto' },
  logoutButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: normalize(18), borderRadius: radius.xs },
  logoutButtonPressed: { opacity: 0.8 },
  logoutText: { color: colors.white, fontSize: normalize(14), fontWeight: '900', letterSpacing: 2 },
  note: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 12, textAlign: 'center' }
});
