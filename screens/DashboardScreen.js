import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboardStats } from '../services/paymentService';
import { getCurrentMonthNumber } from '../utils/date';
import EmptyState from '../components/EmptyState';
import { colors, radius, spacing, normalize, window, layout } from '../utils/theme';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    const useNative = Platform.OS !== 'web';
    try {
      const name = await AsyncStorage.getItem('user_name');
      setUserName(name || 'User');
      
      const result = await getDashboardStats(getCurrentMonthNumber());
      setStats(result);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: useNative,
      }).start();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !stats) {
    return (
      <View style={[styles.center, { backgroundColor: colors.white }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const renderActivityItem = ({ item }) => (
    <Animated.View style={[styles.activityCard, { opacity: fadeAnim }]}>
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle}>{item.memberName?.toUpperCase() || 'CONTRIBUTION'}</Text>
        <Text style={styles.activitySub}>{item.paymentMode?.toUpperCase()} • RECEIVED</Text>
      </View>
      <Text style={styles.activityAmount}>₹{item.amount}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={stats?.recentActivity || []}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.text} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View style={styles.brandBlock}>
                <View style={styles.hybridBrand}>
                  <Text style={styles.brandHeavy}>Chit</Text>
                  <Text style={styles.brandLight}>Flow</Text>
                </View>
                <Text style={styles.greetingLight}>DASHBOARD</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable onPress={() => navigation.navigate('Profile')}>
                  <MaterialCommunityIcons name="account-circle-outline" size={normalize(28)} color={colors.text} style={styles.profileIcon} />
                </Pressable>
              </View>
            </View>

            <Text 
              style={styles.userLabel} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              WELCOME BACK, {userName.toUpperCase()}
            </Text>

            <View style={styles.heroSection}>
              <Text style={styles.sectionLabel}>MONTHLY TOTAL</Text>
              <Text style={styles.mainAmount} numberOfLines={1} adjustsFontSizeToFit>
                ₹{stats?.monthlyCollection?.toLocaleString() || 0}
              </Text>
              <View style={styles.accentBar} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>GROUPS</Text>
                <Text style={styles.statNum}>{stats?.totalGroups || 0}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>MEMBERS</Text>
                <Text style={styles.statNum}>{stats?.totalMembers || 0}</Text>
              </View>
            </View>

            <View style={styles.actionSection}>
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
              <View style={styles.btnRow}>
                <Pressable 
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} 
                  onPress={() => navigation.navigate('GroupList')}
                >
                  <Text style={styles.primaryBtnText}>GROUPS</Text>
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [styles.primaryBtn, styles.blackBtn, pressed && styles.pressed]} 
                  onPress={() => navigation.navigate('CreateGroup')}
                >
                  <Text style={[styles.primaryBtnText, styles.whiteText]}>CREATE</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.activityHeader}>
              <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState 
              title="NO ACTIVITY" 
              subtitle="Transactions will appear here." 
            />
          </View>
        }
        renderItem={renderActivityItem}
      />
      
      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateGroup')}>
        <MaterialCommunityIcons name="plus" size={normalize(32)} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  list: layout.container,
  scrollContent: { paddingBottom: normalize(120) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.xl, paddingTop: spacing.xxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileIcon: { opacity: 0.8 },
  brandBlock: { borderLeftWidth: 3, borderLeftColor: colors.text, paddingLeft: 12 },
  hybridBrand: { flexDirection: 'row', alignItems: 'baseline', marginLeft: -2 },
  brandHeavy: { fontSize: normalize(24), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  brandLight: { fontSize: normalize(24), fontWeight: '200', color: colors.text, letterSpacing: -0.5 },
  greetingLight: { fontSize: normalize(24), fontWeight: '200', color: colors.text, letterSpacing: -0.5, marginTop: -6 },
  userLabel: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: spacing.xl, maxWidth: '80%' },
  logoutBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: radius.full },
  heroSection: { marginBottom: spacing.xxl },
  sectionLabel: { fontSize: normalize(10), fontWeight: '800', color: '#9CA3AF', letterSpacing: 2, marginBottom: 12 },
  mainAmount: { fontSize: normalize(64), fontWeight: '900', color: colors.text, letterSpacing: -3 },
  accentBar: { height: 6, backgroundColor: colors.text, width: normalize(60), marginTop: 4 },
  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: '#F9FAFB', 
    borderRadius: radius.xs, 
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    alignItems: 'center'
  },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: normalize(9), fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 6 },
  statNum: { fontSize: normalize(28), fontWeight: '900', color: colors.text },
  statDivider: { width: 1, height: '60%', backgroundColor: '#E5E7EB' },
  actionSection: { marginBottom: spacing.xxl },
  btnRow: { flexDirection: 'row', gap: spacing.md },
  primaryBtn: { flex: 1, paddingVertical: normalize(18), alignItems: 'center', borderRadius: radius.xs, borderWidth: 1.5, borderColor: colors.text },
  blackBtn: { backgroundColor: colors.text },
  primaryBtnText: { fontSize: normalize(12), fontWeight: '900', letterSpacing: 2 },
  whiteText: { color: colors.white },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  activityHeader: { marginBottom: spacing.md },
  activityCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginHorizontal: spacing.xl },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: normalize(13), fontWeight: '900', color: colors.text, letterSpacing: 1 },
  activitySub: { fontSize: normalize(9), fontWeight: '700', color: '#9CA3AF', marginTop: 4, letterSpacing: 1 },
  activityAmount: { fontSize: normalize(18), fontWeight: '900', color: colors.text },
  emptyWrap: { paddingVertical: spacing.lg },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: normalize(64), height: normalize(64), borderRadius: radius.xs, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
});
