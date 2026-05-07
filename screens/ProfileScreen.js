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
  const [updateStatus, setUpdateStatus] = useState('LATEST');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Smart fallback for status bar height
  const safeTop = insets.top || StatusBar.currentHeight || 30;

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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onCheckForUpdate = async () => {
    setUpdateStatus('CHECKING');
    try {
      if (Platform.OS === 'web') {
        setTimeout(() => { setUpdateStatus('LATEST'); }, 1000);
        return;
      }
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateStatus('DOWNLOADING');
        await Updates.fetchUpdateAsync();
        setUpdateStatus('READY');
        Alert.alert("Update Ready", "New version downloaded.", [{ text: "INSTALL", onPress: () => Updates.reloadAsync() }]);
      } else {
        setUpdateStatus('LATEST');
        Alert.alert("Up to Date", "You are already using the latest version.");
      }
    } catch (e) {
      setTimeout(() => { setUpdateStatus('LATEST'); }, 1500);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: async () => { await AsyncStorage.clear(); navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }); }, style: 'destructive' }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      
      <View style={styles.verticalSpine} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: safeTop + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
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
            <View style={styles.mainContent}>
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
                  <View style={[styles.diagStatusLine, updateStatus === 'READY' && { backgroundColor: '#3B82F6' }]} />
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
                    <Text style={styles.diagBtnText}>{updateStatus === 'READY' ? 'INSTALL' : 'CHECK'}</Text>
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.bottomSection}>
                <Pressable 
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutText}>Log Out</Text>
                  <MaterialCommunityIcons name="logout" size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* THE ABSOLUTE SHIELD: Opaque white cover that content scrolls BEHIND */}
      <View style={[styles.topBlocker, { height: safeTop }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBlocker: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white, 
    zIndex: 9999, 
  },
  verticalSpine: { position: 'absolute', left: spacing.xl + normalize(4), top: 0, bottom: 0, width: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, ...layout.container },
  header: { marginBottom: spacing.xxl },
  backBtn: { marginBottom: spacing.md, marginLeft: -4 },
  step: { fontSize: normalize(10), fontWeight: '900', color: '#9CA3AF', letterSpacing: 2, marginBottom: 4 },
  brandTitleContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  titleHeavy: { fontSize: normalize(44), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  titleLight: { fontSize: normalize(44), fontWeight: '200', color: colors.text, letterSpacing: -1 },
  loaderWrap: { paddingVertical: 100, justifyContent: 'center', alignItems: 'center' },
  mainContent: { flex: 1 },
  profileSection: { marginVertical: spacing.xl },
  avatarWrap: { 
    width: normalize(70), 
    height: normalize(70), 
    backgroundColor: colors.text, 
    borderRadius: radius.xs, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.lg
  },
  label: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  name: { fontSize: normalize(42), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  revealBar: { height: 6, backgroundColor: colors.text, width: normalize(60), marginTop: 4 },
  detailsGrid: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xl },
  detailCard: { flex: 1, backgroundColor: '#F9FAFB', padding: spacing.md, borderRadius: radius.xs },
  detailLabel: { fontSize: normalize(8), fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 },
  detailValue: { fontSize: normalize(18), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  diagnosticHub: { marginVertical: spacing.xl },
  diagCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.xs, borderWidth: 1, borderColor: '#F3F4F6' },
  diagCardReady: { borderColor: '#3B82F6', backgroundColor: '#F0F7FF' },
  diagStatusLine: { width: 4, height: '100%', minHeight: 32, backgroundColor: '#10B981', borderRadius: 2, marginRight: 12 },
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
  bottomSection: { marginTop: spacing.xxl },
  logoutButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: normalize(18), borderRadius: radius.xs },
  logoutButtonPressed: { opacity: 0.8 },
  logoutText: { color: colors.white, fontSize: normalize(14), fontWeight: '900', letterSpacing: 2 }
});
