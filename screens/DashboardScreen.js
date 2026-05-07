import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboardStats } from '../services/paymentService';
import { getCurrentMonthNumber } from '../utils/date';
import EmptyState from '../components/EmptyState';
import { colors, elevation, radius, spacing, normalize, window, layout } from '../utils/theme';

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
        <Text style={styles.activityTitle}>{item.memberName || 'CONTRIBUTION'}</Text>
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
              <View>
                <Text style={styles.greetingBold}>{userName.toUpperCase()}</Text>
                <Text style={styles.greetingLight}>DASHBOARD</Text>
              </View>
              <Pressable style={styles.profileBtn} onPress={() => navigation.navigate('Welcome')}>
                <MaterialCommunityIcons name="logout-variant" size={normalize(24)} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.mainStatContainer}>
              <Text style={styles.statLabel}>MONTHLY TOTAL</Text>
              <Text style={styles.statValue}>₹{stats?.monthlyCollection?.toLocaleString() || 0}</Text>
              <View style={styles.statLine} />
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>GROUPS</Text>
                <Text style={styles.gridValue}>{stats?.totalGroups || 0}</Text>
              </View>
              <View style={styles.gridDivider} />
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>MEMBERS</Text>
                <Text style={styles.gridValue}>{stats?.totalMembers || 0}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            </View>
            
            <View style={styles.actionRow}>
              <Pressable 
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]} 
                onPress={() => navigation.navigate('GroupList')}
              >
                <Text style={styles.actionBtnText}>GROUPS</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnBlack, pressed && styles.pressed]} 
                onPress={() => navigation.navigate('CreateGroup')}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnTextWhite]}>CREATE</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState 
            title="NO ACTIVITY" 
            subtitle="Transactions will appear here." 
          />
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
  scrollContent: { paddingBottom: normalize(100) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.xl, paddingTop: spacing.xxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xxl },
  greetingBold: { fontSize: normalize(28), fontWeight: '900', color: colors.text, letterSpacing: -1 },
  greetingLight: { fontSize: normalize(28), fontWeight: '200', color: colors.text, letterSpacing: -1, marginTop: -8 },
  profileBtn: { padding: 4 },
  mainStatContainer: { marginBottom: spacing.xxl },
  statLabel: { fontSize: normalize(10), fontWeight: '800', color: colors.textLight, letterSpacing: 2, marginBottom: 8 },
  statValue: { fontSize: normalize(52), fontWeight: '900', color: colors.text, letterSpacing: -2 },
  statLine: { height: 4, backgroundColor: colors.text, width: normalize(60), marginTop: 8 },
  grid: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: radius.xs, padding: spacing.lg, marginBottom: spacing.xxl },
  gridItem: { flex: 1, alignItems: 'flex-start' },
  gridLabel: { fontSize: normalize(10), fontWeight: '800', color: colors.textLight, letterSpacing: 1.5, marginBottom: 4 },
  gridValue: { fontSize: normalize(24), fontWeight: '900', color: colors.text },
  gridDivider: { width: 1, height: '100%', backgroundColor: '#E5E7EB', marginHorizontal: spacing.lg },
  sectionHeader: { marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle: { fontSize: normalize(12), fontWeight: '900', color: colors.text, letterSpacing: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  actionBtn: { flex: 1, paddingVertical: normalize(16), alignItems: 'center', borderRadius: radius.xs, borderWidth: 1.5, borderColor: colors.text },
  actionBtnBlack: { backgroundColor: colors.text },
  actionBtnText: { fontSize: normalize(12), fontWeight: '900', letterSpacing: 1 },
  actionBtnTextWhite: { color: colors.white },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  activityCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginHorizontal: spacing.xl },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: normalize(14), fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  activitySub: { fontSize: normalize(10), fontWeight: '700', color: colors.textLight, marginTop: 2, letterSpacing: 0.5 },
  activityAmount: { fontSize: normalize(18), fontWeight: '900', color: colors.text },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: normalize(64), height: normalize(64), borderRadius: radius.xs, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', ...elevation.lg },
});
