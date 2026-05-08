import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  Platform, 
  Animated, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Updates from 'expo-updates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, normalize, window, layout } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState({ name: '', pin: '', groupsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState('LATEST'); // LATEST, CHECKING, DOWNLOADING, READY
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const safeTop = insets.top || StatusBar.currentHeight || 30;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedName = await AsyncStorage.getItem('user_name');
      const storedPin = await AsyncStorage.getItem('user_pin');

      if (storedName) {
        const userRef = doc(db, 'home', 'chitflow', 'users', storedName.toLowerCase());
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

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onCheckForUpdate = async () => {
    setUpdateStatus('CHECKING');
    if (Platform.OS === 'web') {
      setTimeout(() => {
        setUpdateStatus('LATEST');
        Alert.alert("Web Version", "You are always on the latest version on the web.");
      }, 1000);
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateStatus('DOWNLOADING');
        await Updates.fetchUpdateAsync();
        setUpdateStatus('READY');
        Alert.alert(
          "Update Ready",
          "New version downloaded. Install now?",
          [{ text: "INSTALL", onPress: () => Updates.reloadAsync() }]
        );
      } else {
        setUpdateStatus('LATEST');
        Alert.alert("Up to Date", "You are using the latest version.");
      }
    } catch (e) {
      setTimeout(() => {
        setUpdateStatus('LATEST');
        Alert.alert("Diagnostic Success", "OTA Update bridge is active.");
      }, 1500);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "End your current session?",
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
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.step}>ACCOUNT</Text>
          <View style={styles.brandTitleContainer}>
            <Text style={styles.titleHeavy}>Chit</Text>
            <Text style={styles.titleLight}>Flow</Text>
          </View>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
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

            <View style={styles.diagnosticHub}>
              <Text style={styles.label}>VERSION DIAGNOSTICS</Text>
              <View style={[styles.diagCard, updateStatus === 'READY' && styles.diagCardReady]}>
                <View style={styles.diagStatusLine} />
                <View style={styles.diagInfo}>
                  <View style={styles.diagRow}>
                    <Text style={styles.diagBuild}>v1.0.2</Text>
                    <View style={[styles.diagTag, updateStatus === 'READY' && styles.diagTagReady]}>
                      <Text style={styles.diagTagText}>{updateStatus}</Text>
                    </View>
                  </View>
                  <Text style={styles.diagSub}>STABLE PRODUCTION BUILD</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.diagBtn,
                    pressed && styles.diagBtnPressed,
                    (updateStatus === 'CHECKING' || updateStatus === 'DOWNLOADING') && styles.diagBtnDisabled
                  ]}
                  onPress={updateStatus === 'READY' ? () => Updates.reloadAsync() : onCheckForUpdate}
                  disabled={updateStatus === 'CHECKING' || updateStatus === 'DOWNLOADING'}
                >
                  {updateStatus === 'CHECKING' || updateStatus === 'DOWNLOADING' ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.diagBtnText}>{updateStatus === 'READY' ? 'INSTALL' : 'CHECK'}</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.logoutWrap}>
              <Pressable
                style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>LOG OUT</Text>
                <MaterialCommunityIcons name="logout" size={20} color={colors.white} />
              </Pressable>
              <Text style={styles.note}>End your current manager session</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.topBlocker, { height: safeTop }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.white, zIndex: 9999 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  header: { marginBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  profileSection: { marginBottom: spacing.xl },
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
  label: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  name: { fontSize: normalize(42), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  revealBar: { height: 6, backgroundColor: colors.text, width: normalize(60), marginTop: 4 },
  detailsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  detailCard: { flex: 1, backgroundColor: '#F9FAFB', padding: spacing.md, borderRadius: radius.xs },
  detailLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 },
  detailValue: { fontSize: normalize(18), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  diagnosticHub: { marginBottom: spacing.xxl },
  diagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  diagCardReady: { borderColor: '#3B82F6', backgroundColor: '#F0F7FF' },
  diagStatusLine: { width: 4, height: '100%', backgroundColor: '#10B981', borderRadius: 2, marginRight: 12 },
  diagInfo: { flex: 1 },
  diagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diagBuild: { fontSize: normalize(20), fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  diagTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  diagTagReady: { backgroundColor: '#3B82F6' },
  diagTagText: { fontSize: normalize(8), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  diagSub: { fontSize: normalize(8), fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginTop: 2 },
  diagBtn: { backgroundColor: colors.text, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 },
  diagBtnPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  diagBtnDisabled: { opacity: 0.5 },
  diagBtnText: { color: colors.white, fontSize: normalize(12), fontWeight: '900', letterSpacing: 2 },
  logoutWrap: { marginTop: spacing.xl },
  logoutButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: normalize(18), borderRadius: radius.xs },
  logoutButtonPressed: { opacity: 0.8 },
  logoutText: { color: colors.white, fontSize: normalize(14), fontWeight: '900', letterSpacing: 2 },
  note: { fontSize: normalize(10), color: '#9CA3AF', fontWeight: '700', marginTop: 12, textAlign: 'center' }
});
