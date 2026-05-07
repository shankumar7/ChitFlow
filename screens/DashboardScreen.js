import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDashboardStats } from '../services/paymentService';
import { getCurrentMonthNumber } from '../utils/date';
import EmptyState from '../components/EmptyState';
import { colors, elevation, radius, spacing, normalize, window, layout } from '../utils/theme';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const GlassContainer = Platform.OS === 'web' ? View : BlurView;

  const loadStats = useCallback(async () => {
    const useNative = Platform.OS !== 'web';
    try {
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
    loadStats();
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
           <View style={styles.center}>
             <ActivityIndicator size="large" color={colors.white} />
             <Text style={[styles.heroGreeting, { marginTop: 20, color: colors.white }]}>LOADING YOUR WEALTH...</Text>
           </View>
        </LinearGradient>
      </View>
    );
  }

  const renderActivityItem = ({ item }) => (
    <Animated.View style={[styles.activityCard, { opacity: fadeAnim }]}>
      <View style={styles.activityIconWrap}>
        <MaterialCommunityIcons 
          name="cash-check" 
          size={normalize(22)} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.activityInfo}>
        <View style={styles.activityRow}>
          <Text style={styles.activityTitle}>{item.memberName || 'Contribution'}</Text>
          <Text style={styles.activityAmount}>₹{item.amount}</Text>
        </View>
        <Text style={styles.activitySub}>Received • {item.paymentMode?.toUpperCase()}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={stats?.recentActivity || []}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <LinearGradient 
              colors={[colors.primaryDark, colors.primary, colors.secondary]} 
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
              style={styles.heroGradient}
            >
              <View style={styles.circle1} />
              <View style={styles.circle2} />
              <GlassContainer 
                intensity={30} tint="light" 
                style={[styles.heroGlass, Platform.OS === 'web' && { backgroundColor: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(15px)' }]}
              >
                <View style={styles.heroTop}>
                  <View>
                    <Text style={styles.heroGreeting}>Current Status</Text>
                    <Text style={styles.heroTitle}>Dashboard</Text>
                  </View>
                  <Pressable style={styles.profileBtn}>
                    <MaterialCommunityIcons name="account-circle-outline" size={normalize(30)} color={colors.white} />
                  </Pressable>
                </View>
                <View style={styles.heroMainStat}>
                  <Text style={styles.heroMainLabel}>Monthly Collection</Text>
                  <Text style={styles.heroMainValue}>₹{stats?.monthlyCollection?.toLocaleString() || 0}</Text>
                </View>
                <View style={styles.heroGrid}>
                  <View style={styles.heroGridItem}>
                    <Text style={styles.heroGridLabel}>GROUPS</Text>
                    <Text style={styles.heroGridValue}>{stats?.totalGroups || 0}</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroGridItem}>
                    <Text style={styles.heroGridLabel}>MEMBERS</Text>
                    <Text style={styles.heroGridValue}>{stats?.totalMembers || 0}</Text>
                  </View>
                </View>
              </GlassContainer>
            </LinearGradient>

            <View style={styles.actionSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                <Pressable 
                  style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]} 
                  onPress={() => navigation.navigate('GroupList')}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons name="view-grid" size={normalize(26)} color={colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Groups</Text>
                </Pressable>
                
                <Pressable 
                  style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]} 
                  onPress={() => navigation.navigate('CreateGroup')}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: colors.secondarySoft }]}>
                    <MaterialCommunityIcons name="plus-thick" size={normalize(26)} color={colors.secondary} />
                  </View>
                  <Text style={styles.actionLabel}>Create</Text>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]} 
                  onPress={() => {}}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: colors.accentSoft }]}>
                    <MaterialCommunityIcons name="chart-box" size={normalize(26)} color={colors.accent} />
                  </View>
                  <Text style={styles.actionLabel}>Reports</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Pressable>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState 
            title="No transactions yet" 
            subtitle="Recent payments will appear here once recorded." 
          />
        }
        renderItem={renderActivityItem}
      />
      
      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateGroup')}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.fabGradient}>
          <MaterialCommunityIcons name="plus" size={normalize(32)} color={colors.white} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: layout.container,
  scrollContent: { paddingBottom: normalize(100) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.xl },
  heroGradient: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg, ...elevation.lg },
  circle1: { position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.18)' },
  circle2: { position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  heroGlass: { padding: spacing.xl, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  heroGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: normalize(12), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  heroTitle: { color: colors.white, fontSize: normalize(34), fontWeight: '900', letterSpacing: -0.5 },
  profileBtn: { width: normalize(46), height: normalize(46), borderRadius: normalize(23), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  heroMainStat: { marginBottom: spacing.xl },
  heroMainLabel: { color: 'rgba(255,255,255,0.8)', fontSize: normalize(13), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  heroMainValue: { color: colors.white, fontSize: normalize(44), fontWeight: '900', marginTop: 4, letterSpacing: -1 },
  heroGrid: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  heroGridItem: { flex: 1, alignItems: 'center' },
  heroGridLabel: { color: 'rgba(255,255,255,0.6)', fontSize: normalize(10), fontWeight: '800', letterSpacing: 1 },
  heroGridValue: { color: colors.white, fontSize: normalize(22), fontWeight: '900', marginTop: 2 },
  heroDivider: { width: 1, height: normalize(28), backgroundColor: 'rgba(255,255,255,0.2)' },
  actionSection: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: normalize(20), fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  actionGrid: { flexDirection: 'row', gap: spacing.md },
  actionCard: { flex: 1, borderRadius: radius.xl, padding: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, ...elevation.sm },
  cardPressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  actionIconWrap: { width: normalize(56), height: normalize(56), borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  actionLabel: { fontSize: normalize(13), fontWeight: '800', color: colors.text },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  viewAll: { color: colors.primary, fontWeight: '800', fontSize: normalize(14) },
  activityCard: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md, borderRadius: radius.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...elevation.card },
  activityIconWrap: { width: normalize(44), height: normalize(44), borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  activityInfo: { flex: 1 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityTitle: { fontSize: normalize(15), fontWeight: '700', color: colors.text },
  activityAmount: { fontSize: normalize(16), fontWeight: '800', color: colors.primary },
  activitySub: { fontSize: normalize(12), color: colors.textMuted, marginTop: 2 },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: normalize(64), height: normalize(64), borderRadius: normalize(32), ...elevation.lg },
  fabGradient: { flex: 1, borderRadius: normalize(32), alignItems: 'center', justifyContent: 'center' },
});
